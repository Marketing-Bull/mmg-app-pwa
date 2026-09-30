/**
 * GoHighLevel sync for RSVPs and leads (server only).
 *
 * Every RSVP and every contact / sponsorship submission is captured here as
 * well as being emailed through /api/contact. What happens next depends on
 * whether GHL is switched on:
 *
 *   GHL_ENABLED unset / not "true"   → captured into the outbox, nothing sent.
 *   GHL_ENABLED=true + credentials   → captured into the outbox, and the whole
 *                                      outbox is drained into GHL, oldest first.
 *
 * So the day GHL_TOKEN and GHL_LOCATION_ID land and the flag is flipped, every
 * RSVP and lead captured before go-live flows into GHL with the next
 * submission (or immediately via an admin `{ action: "replay" }`). A send that
 * fails goes back in the outbox instead of being dropped.
 *
 * The outbox lives in the store from lib/kv — durable only when a Redis store
 * is connected. See the README section on GoHighLevel.
 */

import { store } from "./kv";

const API_BASE = process.env.GHL_API_BASE ?? "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

const OUTBOX = "mmg:ghl:outbox";
/** Captures GHL rejected five times in a row. Kept, never deleted, for a human to look at. */
const DEAD_LETTER = "mmg:ghl:failed";
const MAX_ATTEMPTS = 5;
const REPLAY_LOCK = "mmg:ghl:replaying";
const DEDUPE_MS = 10 * 60_000;
const REPLAY_BATCH = 25;
const REPLAY_BUDGET_MS = 25_000;

export const SOURCE = "MMG Connect App";

export type RsvpStatus = "going" | "maybe" | "no";

interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
}

export type Capture =
  | (Contact & {
      type: "rsvp";
      status: RsvpStatus;
      eventSlug: string;
      eventTitle: string;
      eventDate: string;
      role: string;
      guests: number;
      capturedAt: string;
    })
  | (Contact & {
      type: "lead";
      /** Which form: "contact" or "sponsorship". */
      form: string;
      interest: string;
      message: string;
      capturedAt: string;
    });

export function ghlEnabled(): boolean {
  return process.env.GHL_ENABLED === "true";
}

export function ghlConfigured(): boolean {
  return Boolean(process.env.GHL_TOKEN && process.env.GHL_LOCATION_ID);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);
}

/** Validates an untrusted request body into a Capture, or names what's wrong. */
export function toCapture(
  body: Record<string, unknown>,
  now = new Date(),
): Capture | { error: string } {
  const [firstFromName, ...rest] = text(body.name, 120).split(/\s+/);
  const contact: Contact = {
    firstName: text(body.firstName, 60) || firstFromName || "",
    lastName: text(body.lastName, 60) || rest.join(" "),
    email: text(body.email, 254).toLowerCase(),
    phone: text(body.phone, 40),
    company: text(body.company, 120),
  };
  if (!EMAIL_RE.test(contact.email)) return { error: "bad_email" };

  if (body.type === "rsvp") {
    const status = body.status;
    if (status !== "going" && status !== "maybe" && status !== "no") return { error: "bad_status" };
    const eventSlug = text(body.eventSlug, 200);
    if (!eventSlug) return { error: "no_event" };
    const guests = Math.max(0, Math.min(20, Math.floor(Number(body.guests) || 0)));
    return {
      ...contact,
      type: "rsvp",
      status,
      eventSlug,
      eventTitle: text(body.eventTitle, 200),
      eventDate: text(body.eventDate, 40),
      role: text(body.role, 40),
      guests,
      capturedAt: now.toISOString(),
    };
  }

  if (body.type === "lead") {
    return {
      ...contact,
      type: "lead",
      form: text(body.form, 40) || "contact",
      interest: text(body.interest, 200),
      message: String(body.message ?? "")
        .trim()
        .slice(0, 2_000),
      capturedAt: now.toISOString(),
    };
  }

  return { error: "bad_type" };
}

/** Same person, same event, same answer within ten minutes is a double-tap. */
function dedupeKey(capture: Capture): string {
  return capture.type === "rsvp"
    ? `mmg:ghl:seen:rsvp:${capture.email}:${capture.eventSlug}:${capture.status}`
    : `mmg:ghl:seen:lead:${capture.email}:${capture.form}:${capture.interest}`;
}

export type CaptureResult = { ok: true; status: "queued" | "duplicate" };

/**
 * Every capture goes through the outbox, live or not, so there is exactly one
 * path into GHL and it is always oldest-first. When GHL is live the route
 * drains the outbox right after responding (see `replay`).
 */
export async function capture(item: Capture): Promise<CaptureResult> {
  if (!(await store.claim(dedupeKey(item), DEDUPE_MS))) return { ok: true, status: "duplicate" };
  if (ghlEnabled() && !ghlConfigured()) {
    console.error("GHL_ENABLED is true but GHL_TOKEN / GHL_LOCATION_ID are not set — queued only.");
  }
  await enqueue(item);
  return { ok: true, status: "queued" };
}

async function enqueue(item: Capture): Promise<void> {
  await store.push(OUTBOX, JSON.stringify(item));
  if (!store.durable) {
    console.warn(
      "[ghl] outbox is in memory — connect a Redis store (KV_REST_API_URL / KV_REST_API_TOKEN) so captures survive a redeploy.",
    );
  }
}

export async function outboxDepth(): Promise<number> {
  return store.length(OUTBOX);
}

/**
 * Drains the outbox into GHL, oldest first. One replay at a time across
 * instances. It keeps pulling batches until the outbox is empty or the time
 * budget is spent, so captures that arrive mid-drain go out in the same pass;
 * anything left over goes out with the next capture or an admin replay.
 */
export async function replay(): Promise<{ sent: number; failed: number; remaining: number }> {
  if (!ghlEnabled() || !ghlConfigured())
    return { sent: 0, failed: 0, remaining: await outboxDepth() };
  if (!(await store.claim(REPLAY_LOCK, 5 * 60_000))) {
    return { sent: 0, failed: 0, remaining: await outboxDepth() };
  }

  let sent = 0;
  const failed: string[] = [];
  const deadline = Date.now() + REPLAY_BUDGET_MS;
  try {
    while (Date.now() < deadline) {
      const batch = await store.shift(OUTBOX, REPLAY_BATCH);
      if (batch.length === 0) break;
      for (const raw of batch) {
        let item: Capture & { attempts?: number };
        try {
          item = JSON.parse(raw);
        } catch {
          await store.push(DEAD_LETTER, raw);
          continue;
        }
        try {
          await send(item);
          sent += 1;
        } catch (error) {
          const attempts = (item.attempts ?? 0) + 1;
          console.error(`[ghl] send failed (attempt ${attempts}):`, (error as Error).message);
          if (attempts >= MAX_ATTEMPTS)
            await store.push(DEAD_LETTER, JSON.stringify({ ...item, attempts }));
          else failed.push(JSON.stringify({ ...item, attempts }));
        }
      }
    }
  } finally {
    for (const raw of failed) await store.push(OUTBOX, raw);
    await store.del(REPLAY_LOCK);
  }
  if (sent) console.log(`[ghl] replayed ${sent} queued capture(s) into GoHighLevel`);
  return { sent, failed: failed.length, remaining: await outboxDepth() };
}

// ---------------------------------------------------------------------------
// GoHighLevel API v2
// ---------------------------------------------------------------------------

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GHL_TOKEN}`,
      Version: API_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GHL ${method} ${path} → ${response.status} ${detail.slice(0, 300)}`);
  }
  return (await response.json().catch(() => ({}))) as T;
}

/** Looked up by name, once per instance. Absent means tags-only, never an error. */
let guestsFieldId: Promise<string | null> | undefined;
let rsvpStage: Promise<{ pipelineId: string; stageId: string } | null> | undefined;

function findGuestsField(locationId: string): Promise<string | null> {
  guestsFieldId ??= api<{ customFields?: { id: string; name?: string }[] }>(
    "GET",
    `/locations/${encodeURIComponent(locationId)}/customFields`,
  )
    .then(
      (data) =>
        data.customFields?.find((field) => field.name?.trim().toLowerCase() === "guests")?.id ??
        null,
    )
    .catch((error) => {
      guestsFieldId = undefined;
      console.warn("[ghl] custom field lookup failed:", (error as Error).message);
      return null;
    });
  return guestsFieldId;
}

function findRsvpStage(locationId: string) {
  rsvpStage ??= api<{
    pipelines?: { id: string; name?: string; stages?: { id: string; name?: string }[] }[];
  }>("GET", `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`)
    .then((data) => {
      const pipeline = data.pipelines?.find((p) => /\bevents?\b/i.test(p.name ?? ""));
      const stage = pipeline?.stages?.find((s) => /rsvp/i.test(s.name ?? ""));
      return pipeline && stage ? { pipelineId: pipeline.id, stageId: stage.id } : null;
    })
    .catch((error) => {
      rsvpStage = undefined;
      console.warn("[ghl] pipeline lookup failed:", (error as Error).message);
      return null;
    });
  return rsvpStage;
}

const STATUS_LABEL: Record<RsvpStatus, string> = {
  going: "Going",
  maybe: "Maybe",
  no: "Can't make it",
};

function tagsFor(item: Capture): string[] {
  if (item.type === "lead") return ["mmg-app", `lead:${item.form}`];
  return [
    "mmg-app",
    `rsvp:${item.eventSlug}`,
    `rsvp-status:${item.status}`,
    ...(item.role ? [`role:${item.role.toLowerCase()}`] : []),
  ];
}

function noteFor(item: Capture): string {
  if (item.type === "lead") {
    return [
      `${item.form === "sponsorship" ? "Sponsorship inquiry" : "Contact form"} via ${SOURCE}`,
      item.interest && `Interest: ${item.interest}`,
      item.message && `Message: ${item.message}`,
      `Captured: ${item.capturedAt}`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `RSVP via ${SOURCE}: ${STATUS_LABEL[item.status]}`,
    `Event: ${item.eventTitle || item.eventSlug}${item.eventDate ? ` (${item.eventDate})` : ""}`,
    item.role && `Attending as: ${item.role}`,
    item.status !== "no" && `Guests: ${item.guests}`,
    `Captured: ${item.capturedAt}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Upsert the contact (GHL matches on email, then phone), tag it, then the
 * extras. The contact and its tags are the part that must land — a failure
 * there throws so the capture is kept. The extras only log on failure, so a
 * replay can't create a second opportunity or note.
 */
async function send(item: Capture): Promise<void> {
  const locationId = process.env.GHL_LOCATION_ID as string;
  const name = [item.firstName, item.lastName].filter(Boolean).join(" ");

  const upserted = await api<{ contact?: { id?: string }; id?: string }>(
    "POST",
    "/contacts/upsert",
    {
      locationId,
      firstName: item.firstName || undefined,
      lastName: item.lastName || undefined,
      name: name || undefined,
      email: item.email,
      phone: item.phone || undefined,
      companyName: item.company || undefined,
      source: SOURCE,
    },
  );
  const contactId = upserted.contact?.id ?? upserted.id;
  if (!contactId) throw new Error("GHL upsert returned no contact id");

  await api("POST", `/contacts/${encodeURIComponent(contactId)}/tags`, { tags: tagsFor(item) });

  const extras: Promise<unknown>[] = [
    api("POST", `/contacts/${encodeURIComponent(contactId)}/notes`, { body: noteFor(item) }),
  ];

  if (item.type === "rsvp" && item.status !== "no") {
    extras.push(
      findGuestsField(locationId).then((fieldId) =>
        fieldId
          ? api("PUT", `/contacts/${encodeURIComponent(contactId)}`, {
              customFields: [{ id: fieldId, field_value: String(item.guests) }],
            })
          : console.warn('[ghl] no "Guests" custom field — guest count kept in the note only.'),
      ),
    );
  }

  if (item.type === "rsvp" && item.status === "going") {
    extras.push(
      findRsvpStage(locationId).then((stage) =>
        stage
          ? api("POST", "/opportunities/", {
              locationId,
              pipelineId: stage.pipelineId,
              pipelineStageId: stage.stageId,
              contactId,
              name: `${name || item.email} — ${item.eventTitle || item.eventSlug}`,
              status: "open",
              source: SOURCE,
            })
          : console.warn("[ghl] no Events pipeline with an RSVP stage — tags only."),
      ),
    );
  }

  const results = await Promise.allSettled(extras);
  for (const result of results) {
    if (result.status === "rejected") console.warn("[ghl]", (result.reason as Error).message);
  }
}
