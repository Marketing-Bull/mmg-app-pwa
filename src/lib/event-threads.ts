/**
 * Per-event guest discussions (server only).
 *
 * Each event gets a thread in the Talk tab. Only guests who RSVP'd Going or
 * Maybe can post; anyone can read. Names are shown as first name + last
 * initial, and the identity a message was posted under (the guest's email)
 * never leaves the server — moderation works by message id.
 *
 * The RSVP gate is client-attested: the app has no accounts, so it trusts the
 * status the browser reports. That is still tighter than the open comment box
 * it replaces, and the moderation tools below cover what gets through.
 */

import threadConfig from "../../content/event-threads.json";
import { store } from "./kv";

export const MAX_CHARS = 500;
export const AUTO_HIDE_REPORTS = 3;
export const LOCK_DAYS_AFTER_EVENT = 7;
export const POST_INTERVAL_MS = 5_000;
export const MAX_MESSAGES = 500;

export type PostingRsvp = "going" | "maybe";

export interface PinnedSlot {
  title: string;
  body: string;
  enabled: boolean;
}

interface StoredMessage {
  id: string;
  identity: string;
  displayName: string;
  body: string;
  hasLink: boolean;
  createdAt: string;
  hidden: boolean;
  reportedBy: string[];
  rsvp: PostingRsvp;
}

interface StoredThread {
  messages: StoredMessage[];
  muted: Record<string, number>;
  lastPostAt: Record<string, number>;
  /** Set once an admin touches the pin; until then the content default applies. */
  pinned?: PinnedSlot | null;
}

/** What the browser is allowed to see. */
export interface PublicMessage {
  id: string;
  displayName: string;
  body: string;
  hasLink: boolean;
  createdAt: string;
  rsvp: PostingRsvp;
}

export interface PublicThread {
  slug: string;
  enabled: boolean;
  locked: boolean;
  pinned: PinnedSlot | null;
  messages: PublicMessage[];
}

interface ThreadConfig {
  enabled: boolean;
  pinned: PinnedSlot | null;
  seeds: { displayName: string; body: string }[];
}

interface ConfigFile {
  defaults: Partial<ThreadConfig>;
  threads: Record<string, Partial<ThreadConfig>>;
}

const config = threadConfig as ConfigFile;

export function threadConfigFor(slug: string): ThreadConfig {
  const merged = { ...config.defaults, ...config.threads[slug] };
  return {
    enabled: merged.enabled !== false,
    pinned: merged.pinned ?? null,
    seeds: merged.seeds ?? [],
  };
}

const PROFANITY = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "pussy",
  "cunt",
  "nigger",
  "faggot",
  "retard",
];

/** "Jordan Alvarez" → "Jordan A." — a full last name is never shown. */
export function scrubDisplayName(fullName: string): string {
  const parts = String(fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "Guest";
  const first = parts[0].slice(0, 24);
  if (parts.length === 1) return first;
  return `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function containsUrl(text: string): boolean {
  return /(https?:\/\/|www\.)[^\s)]+/i.test(text);
}

export function containsProfanity(text: string): boolean {
  return PROFANITY.some((word) => new RegExp(`\\b${word}s?\\b`, "i").test(text));
}

export type BodyProblem = "empty" | "too_long" | "profanity";

export function checkBody(body: string): BodyProblem | null {
  const text = String(body ?? "").trim();
  if (!text) return "empty";
  if (text.length > MAX_CHARS) return "too_long";
  if (containsProfanity(text)) return "profanity";
  return null;
}

/** Threads lock a week after the event, so old conversations don't draw spam. */
export function isLocked(eventDate: string | null, now = Date.now()): boolean {
  if (!eventDate) return false;
  const at = Date.parse(eventDate);
  if (Number.isNaN(at)) return false;
  return now > at + LOCK_DAYS_AFTER_EVENT * 24 * 60 * 60 * 1000;
}

const threadKey = (slug: string) => `mmg:thread:${slug}`;

async function load(slug: string): Promise<StoredThread> {
  const raw = await store.get(threadKey(slug));
  if (raw) {
    try {
      return JSON.parse(raw) as StoredThread;
    } catch {
      // Unreadable record — start the thread over rather than 500 the page.
    }
  }
  const { seeds } = threadConfigFor(slug);
  return {
    messages: seeds.map((seed, index) => ({
      id: `seed-${index}`,
      identity: "mmg",
      displayName: seed.displayName,
      body: seed.body.trim().slice(0, MAX_CHARS),
      hasLink: containsUrl(seed.body),
      createdAt: new Date(0).toISOString(),
      hidden: false,
      reportedBy: [],
      rsvp: "going",
    })),
    muted: {},
    lastPostAt: {},
  };
}

async function save(slug: string, thread: StoredThread): Promise<void> {
  thread.messages = thread.messages.slice(-MAX_MESSAGES);
  await store.set(threadKey(slug), JSON.stringify(thread));
}

function pinnedFor(slug: string, thread: StoredThread): PinnedSlot | null {
  return thread.pinned !== undefined ? thread.pinned : threadConfigFor(slug).pinned;
}

export async function publicThread(
  slug: string,
  eventDate: string | null,
  now = Date.now(),
): Promise<PublicThread> {
  const thread = await load(slug);
  const pinned = pinnedFor(slug, thread);
  return {
    slug,
    enabled: threadConfigFor(slug).enabled,
    locked: isLocked(eventDate, now),
    pinned: pinned?.enabled ? pinned : null,
    messages: thread.messages
      .filter((message) => !message.hidden)
      .map(({ id, displayName, body, hasLink, createdAt, rsvp }) => ({
        id,
        displayName,
        body,
        hasLink,
        createdAt,
        rsvp,
      })),
  };
}

/** Moderator view: hidden messages included, report counts shown, identities still withheld. */
export async function moderatorThread(slug: string, eventDate: string | null, now = Date.now()) {
  const thread = await load(slug);
  const base = await publicThread(slug, eventDate, now);
  return {
    ...base,
    pinnedSlot: pinnedFor(slug, thread),
    messages: thread.messages.map((message) => ({
      id: message.id,
      displayName: message.displayName,
      body: message.body,
      hasLink: message.hasLink,
      createdAt: message.createdAt,
      rsvp: message.rsvp,
      hidden: message.hidden,
      reports: message.reportedBy.length,
      muted: (thread.muted[message.identity] ?? 0) > now,
    })),
  };
}

export type PostProblem =
  "disabled" | "locked" | "muted" | "rsvp_required" | "rate_limited" | "no_identity" | BodyProblem;

export async function postMessage(
  slug: string,
  eventDate: string | null,
  input: { identity: string; name: string; body: string; rsvp: unknown },
  now = Date.now(),
): Promise<{ ok: true; message: PublicMessage } | { ok: false; reason: PostProblem }> {
  if (!threadConfigFor(slug).enabled) return { ok: false, reason: "disabled" };
  const identity = input.identity.trim().toLowerCase();
  if (!identity) return { ok: false, reason: "no_identity" };
  if (isLocked(eventDate, now)) return { ok: false, reason: "locked" };
  if (input.rsvp !== "going" && input.rsvp !== "maybe") {
    return { ok: false, reason: "rsvp_required" };
  }

  const thread = await load(slug);
  if ((thread.muted[identity] ?? 0) > now) return { ok: false, reason: "muted" };
  if (now - (thread.lastPostAt[identity] ?? 0) < POST_INTERVAL_MS) {
    return { ok: false, reason: "rate_limited" };
  }
  const problem = checkBody(input.body);
  if (problem) return { ok: false, reason: problem };

  const body = input.body.trim();
  const message: StoredMessage = {
    id: `m-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    identity,
    displayName: scrubDisplayName(input.name),
    body,
    hasLink: containsUrl(body),
    createdAt: new Date(now).toISOString(),
    hidden: false,
    reportedBy: [],
    rsvp: input.rsvp,
  };
  thread.messages.push(message);
  thread.lastPostAt[identity] = now;
  await save(slug, thread);

  const { identity: _identity, hidden: _hidden, reportedBy: _reportedBy, ...visible } = message;
  return { ok: true, message: visible };
}

/** A message disappears once three different guests report it. */
export async function reportMessage(
  slug: string,
  id: string,
  reporter: string,
): Promise<{ ok: true; hidden: boolean } | { ok: false; reason: "not_found" | "no_identity" }> {
  const who = reporter.trim().toLowerCase();
  if (!who) return { ok: false, reason: "no_identity" };
  const thread = await load(slug);
  const message = thread.messages.find((candidate) => candidate.id === id);
  if (!message) return { ok: false, reason: "not_found" };
  if (!message.reportedBy.includes(who)) message.reportedBy.push(who);
  if (message.reportedBy.length >= AUTO_HIDE_REPORTS) message.hidden = true;
  await save(slug, thread);
  return { ok: true, hidden: message.hidden };
}

export type AdminAction =
  | { action: "hide" | "unhide"; id: string }
  | { action: "mute"; id: string; minutes?: number }
  | { action: "unmute"; id: string }
  | { action: "pin"; pinned: PinnedSlot | null };

export async function moderate(
  slug: string,
  command: AdminAction,
  now = Date.now(),
): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const thread = await load(slug);

  if (command.action === "pin") {
    thread.pinned = command.pinned;
  } else {
    // Mutes are applied to whoever posted the message, so a moderator never
    // needs to see (or type) a guest's email.
    const message = thread.messages.find((candidate) => candidate.id === command.id);
    if (!message) return { ok: false, reason: "not_found" };
    if (command.action === "hide") message.hidden = true;
    if (command.action === "unhide") message.hidden = false;
    if (command.action === "mute") {
      thread.muted[message.identity] = now + (command.minutes ?? 24 * 60) * 60_000;
    }
    if (command.action === "unmute") delete thread.muted[message.identity];
  }

  await save(slug, thread);
  return { ok: true };
}
