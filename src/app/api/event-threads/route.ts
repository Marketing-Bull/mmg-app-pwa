/**
 * Per-event guest discussions.
 *
 *   GET  ?slug=<event>            the thread as a guest sees it
 *   GET  ?slug=<event> + admin    the moderator view (hidden messages included)
 *   POST { action: "post" }       RSVP-gated, one message per 5 seconds
 *   POST { action: "report" }     three different reporters hide a message
 *   POST { action: "hide" | "unhide" | "mute" | "unmute" | "pin" }   admin only
 *
 * Admin requests carry `x-admin-token` matching MMG_ADMIN_TOKEN. Threads exist
 * only for events in the feed, so a made-up slug can't create storage.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import {
  moderate,
  moderatorThread,
  postMessage,
  publicThread,
  reportMessage,
  type AdminAction,
} from "@/lib/event-threads";
import { getFeedEvent } from "@/lib/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function eventDate(slug: string): Promise<{ date: string | null } | null> {
  if (!slug || slug.length > 200) return null;
  const event = await getFeedEvent(slug);
  return event ? { date: event.date || null } : null;
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const event = await eventDate(slug);
  if (!event) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  if (request.headers.has("x-admin-token")) {
    if (!isAdmin(request)) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, thread: await moderatorThread(slug, event.date) });
  }

  return NextResponse.json({ ok: true, thread: await publicThread(slug, event.date) });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, reason: "malformed" }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, reason: "malformed" }, { status: 400 });
  }

  const slug = String(body.slug ?? "");
  const event = await eventDate(slug);
  if (!event) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  const action = String(body.action ?? "");

  if (action === "post") {
    const result = await postMessage(slug, event.date, {
      identity: String(body.identity ?? ""),
      name: String(body.name ?? ""),
      body: String(body.body ?? ""),
      rsvp: body.rsvp,
    });
    if (!result.ok) {
      const status =
        result.reason === "rate_limited" ? 429 : result.reason === "rsvp_required" ? 403 : 400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  }

  if (action === "report") {
    const result = await reportMessage(slug, String(body.id ?? ""), String(body.reporter ?? ""));
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (["hide", "unhide", "mute", "unmute", "pin"].includes(action)) {
    if (!isAdmin(request)) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }

    let command: AdminAction;
    if (action === "pin") {
      const pinned = isRecord(body.pinned) ? body.pinned : null;
      command = {
        action: "pin",
        pinned: pinned
          ? {
              title: String(pinned.title ?? "").slice(0, 120),
              body: String(pinned.body ?? "").slice(0, 500),
              enabled: pinned.enabled !== false,
            }
          : null,
      };
    } else if (action === "mute") {
      const minutes = Number(body.minutes);
      command = {
        action,
        id: String(body.id ?? ""),
        minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
      };
    } else {
      command = { action: action as "hide" | "unhide" | "unmute", id: String(body.id ?? "") };
    }

    const result = await moderate(slug, command);
    if (!result.ok) return NextResponse.json(result, { status: 404 });
    return NextResponse.json({ ok: true, thread: await moderatorThread(slug, event.date) });
  }

  return NextResponse.json({ ok: false, reason: "unknown_action" }, { status: 400 });
}
