/**
 * GoHighLevel capture for RSVPs and leads. The logic lives in lib/ghl.
 *
 *   GET                                     mode, credentials present, outbox depth
 *   POST { type: "rsvp" | "lead", ... }     capture (queued; sent when GHL is live)
 *   POST { action: "replay" } + admin       drain the outbox now
 *
 * The browser fires these alongside the existing /api/contact email, so a GHL
 * problem can never cost an RSVP — the inbox copy goes out regardless.
 */

import { after, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { store } from "@/lib/kv";
import { capture, ghlConfigured, ghlEnabled, outboxDepth, replay, toCapture } from "@/lib/ghl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;

/** Per-instance, like /api/contact's: a speed bump for a public endpoint. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((at) => now - at >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mode(): "off" | "live" | "unconfigured" {
  if (!ghlEnabled()) return "off";
  return ghlConfigured() ? "live" : "unconfigured";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: mode(),
    durable: store.durable,
    queued: await outboxDepth(),
  });
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

  if (body.action === "replay") {
    if (!isAdmin(request)) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }
    if (mode() !== "live") {
      return NextResponse.json(
        { ok: false, reason: "not_live", mode: mode(), queued: await outboxDepth() },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, ...(await replay()) });
  }

  // Honeypot, same convention as /api/contact.
  if (String(body.website ?? "").trim() !== "") {
    return NextResponse.json({ ok: true, status: "queued" });
  }

  const item = toCapture(body);
  if ("error" in item) {
    return NextResponse.json({ ok: false, reason: item.error }, { status: 400 });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  const result = await capture(item);

  // Drain after responding, so the visitor never waits on GHL.
  if (mode() === "live") {
    after(async () => {
      try {
        await replay();
      } catch (error) {
        console.error("[ghl] replay errored:", error);
      }
    });
  }

  return NextResponse.json(result);
}
