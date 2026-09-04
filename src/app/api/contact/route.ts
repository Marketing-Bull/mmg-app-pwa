/**
 * Form delivery via Resend.
 *
 * Every RSVP, sponsorship inquiry and contact message posts here, and this
 * route relays it to MMG's inbox. It replaced FormSubmit.co, which required the
 * recipient to click an activation email before anything was ever delivered —
 * a step nobody had done, so submissions were silently going nowhere.
 *
 * The sending domain (millersmarketinggroup.com) is already verified in Resend,
 * so mail is sent from it directly and Reply-To is set to whoever submitted the
 * form. Andrew can hit reply and reach them.
 *
 * Keeping the relay server-side also gets the destination address out of the
 * client bundle, which the old client-side POST could not avoid.
 */

import { NextResponse } from "next/server";

/** Needs the Node runtime for the outbound Resend call and per-instance state. */
export const runtime = "nodejs";

/**
 * Overridable so the outbound request can be asserted against a local mock,
 * and so a preview can be pointed somewhere harmless. Defaults to the real API.
 */
const RESEND_ENDPOINT = process.env.RESEND_ENDPOINT ?? "https://api.resend.com/emails";

/** Both default to the real inbox; override per environment if needed. */
const FROM = process.env.MMG_MAIL_FROM ?? "MMG App <noreply@millersmarketinggroup.com>";
const TO = process.env.MMG_MAIL_TO ?? "contact@millersmarketinggroup.com";

/** Set on a preview deployment that shouldn't reach the real inbox. */
const DISABLED = process.env.MMG_FORMS_DISABLED === "true";

const MAX_BODY_BYTES = 16_000;
const MAX_FIELDS = 40;
const MAX_KEY_LENGTH = 80;
const MAX_VALUE_LENGTH = 2_000;
const MAX_SUBJECT_LENGTH = 200;

/**
 * Naive per-instance rate limit.
 *
 * This is a public endpoint that sends mail to a real person, so an unbounded
 * one is an open invitation. Fluid Compute reuses instances, so this genuinely
 * blunts a flood from one address — but it is per-instance, not global, and
 * resets on a cold start. It is a speed bump, not a guarantee; if the form ever
 * draws real abuse, put Vercel BotID in front of it.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Bound the map so a spray of unique IPs can't grow it without limit.
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((at) => now - at >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Header injection guard — a newline in Reply-To must never reach the API. */
function safeEmail(value: unknown): string | undefined {
  const raw = String(value ?? "").trim();
  if (raw.length > 254 || /[\r\n]/.test(raw)) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function renderText(fields: [string, string][]): string {
  return fields.map(([key, value]) => `${key}: ${value}`).join("\n");
}

function renderHtml(subject: string, fields: [string, string][]): string {
  const rows = fields
    .map(
      ([key, value]) =>
        `<tr>` +
        `<td style="padding:6px 14px 6px 0;color:#6c5e56;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(key)}</td>` +
        `<td style="padding:6px 0;color:#261d19;font-size:14px;font-weight:600">${escapeHtml(value)}</td>` +
        `</tr>`,
    )
    .join("");

  return (
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff7e8;padding:24px">` +
    `<div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #eadbc4;border-radius:14px;padding:22px">` +
    `<h1 style="margin:0 0 4px;font-size:17px;color:#a52e2a">${escapeHtml(subject)}</h1>` +
    `<p style="margin:0 0 16px;font-size:12px;color:#6c5e56">Submitted from the MMG app</p>` +
    `<table style="border-collapse:collapse;width:100%">${rows}</table>` +
    `</div></div>`
  );
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ status: "failed", message: "Payload too large." }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "failed", message: "Malformed JSON." }, { status: 400 });
  }

  if (!isRecord(parsed)) {
    return NextResponse.json({ status: "failed", message: "Expected an object." }, { status: 400 });
  }

  const subject = String(parsed.subject ?? "").trim();
  if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ status: "failed", message: "Invalid subject." }, { status: 400 });
  }

  if (!isRecord(parsed.fields)) {
    return NextResponse.json({ status: "failed", message: "Invalid fields." }, { status: 400 });
  }

  /*
    Honeypot. The form renders a hidden field no human fills in, so anything
    that arrives with it set is a bot. Answer 200 as though it worked: telling
    a scraper it was caught only teaches it to try again differently.
  */
  if (String(parsed.website ?? "").trim() !== "") {
    return NextResponse.json({ status: "sent" });
  }

  const fields = Object.entries(parsed.fields)
    .filter(([key, value]) => key.length <= MAX_KEY_LENGTH && value !== undefined && value !== "")
    .slice(0, MAX_FIELDS)
    .map(([key, value]) => [key, String(value).slice(0, MAX_VALUE_LENGTH)] as [string, string]);

  if (fields.length === 0) {
    return NextResponse.json({ status: "failed", message: "Nothing to send." }, { status: 400 });
  }

  // Validation first, so a malformed request fails the same way whether or not
  // the environment is configured to send.
  if (DISABLED) {
    return NextResponse.json({
      status: "skipped",
      message: "Email delivery is turned off in this environment.",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — form submission was not delivered.");
    return NextResponse.json(
      { status: "failed", message: "Mail is not configured." },
      { status: 500 },
    );
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { status: "failed", message: "Too many submissions. Try again shortly." },
      { status: 429 },
    );
  }

  const replyTo = safeEmail(parsed.fields.Email);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        subject,
        text: renderText(fields),
        html: renderHtml(subject, fields),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Resend's message explains the real cause (unverified domain, bad key);
      // log it, but don't hand the detail to the browser.
      const detail = await response.text().catch(() => "");
      console.error(`Resend responded ${response.status}: ${detail.slice(0, 500)}`);
      return NextResponse.json(
        { status: "failed", message: "Could not send right now." },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    console.error("Resend request failed:", error);
    return NextResponse.json(
      { status: "failed", message: "Could not reach the mail service." },
      { status: 502 },
    );
  }
}
