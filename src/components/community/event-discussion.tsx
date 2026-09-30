"use client";

import { Flag, Lock, MessageSquare, Pin, SendHorizonal, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { relativeTime } from "@/lib/format";
import { rsvpStatus, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Mirrors lib/event-threads — that module is server-only, so the shapes are restated here. */
const MAX_CHARS = 500;

interface Message {
  id: string;
  displayName: string;
  body: string;
  hasLink: boolean;
  createdAt: string;
  rsvp: "going" | "maybe";
  /** Moderator view only. */
  hidden?: boolean;
  reports?: number;
  muted?: boolean;
}

interface PinnedSlot {
  title: string;
  body: string;
  enabled: boolean;
}

interface Thread {
  enabled: boolean;
  locked: boolean;
  pinned: PinnedSlot | null;
  messages: Message[];
  /** Moderator view only: the slot whether or not it is switched on. */
  pinnedSlot?: PinnedSlot | null;
}

const PROBLEMS: Record<string, string> = {
  rate_limited: "Slow down a touch, then try again.",
  profanity: "Let's keep it clean in here.",
  too_long: `Keep it under ${MAX_CHARS} characters.`,
  locked: "This conversation is closed.",
  muted: "You can't post in this thread right now.",
  rsvp_required: "RSVP Going or Maybe to join the conversation.",
  empty: "Write something first.",
};

async function fetchThread(slug: string): Promise<Thread | null> {
  try {
    const response = await fetch(`/api/event-threads?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as { ok: boolean; thread?: Thread };
    return data.ok && data.thread ? data.thread : null;
  } catch {
    return null; // Offline — the caller keeps whatever is on screen.
  }
}

/**
 * Per-event guest discussion for the Talk tab.
 *
 * Replaces the browser-only comment box on event pages: messages are stored
 * on the server so every guest sees the same thread, only people who RSVP'd
 * Going or Maybe can post, and names show as first name + last initial.
 */
export function EventDiscussion({ slug, upcoming }: { slug: string; upcoming: boolean }) {
  const { rsvps, profile, hydrated } = useStore();
  const { toast } = useToast();

  const [thread, setThread] = useState<Thread | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [mine, setMine] = useState<string[]>([]);
  const [reported, setReported] = useState<string[]>([]);

  // Moderation. The token is held in memory for this page view only.
  const [moderating, setModerating] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [adminThread, setAdminThread] = useState<Thread | null>(null);
  const [adminNote, setAdminNote] = useState<string | null>(null);

  const rsvp = hydrated ? rsvps[slug] : undefined;
  const status = rsvpStatus(rsvp);
  const canPost = status === "going" || status === "maybe";
  const identity = (rsvp?.email || profile?.email || "").trim().toLowerCase();
  const displayName = rsvp?.name || profile?.name || "";

  const load = useCallback(async () => {
    const next = await fetchThread(slug);
    if (next) setThread(next);
    setLoadFailed(!next);
  }, [slug]);

  useEffect(() => {
    let current = true;
    void fetchThread(slug).then((next) => {
      if (!current) return;
      if (next) setThread(next);
      setLoadFailed(!next);
    });
    return () => {
      current = false;
    };
  }, [slug]);

  const submit = async () => {
    const text = body.trim();
    if (!canPost || busy || !text) return;
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/event-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post",
          slug,
          identity,
          name: displayName,
          body: text,
          rsvp: status,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reason?: string;
        message?: Message;
      };
      if (!data.ok || !data.message) {
        setProblem(PROBLEMS[data.reason ?? ""] ?? "That didn't post. Try again.");
        return;
      }
      const posted = data.message;
      setMine((prev) => [...prev, posted.id]);
      setBody("");
      toast({ tone: "comment", title: "Posted", body: "Everyone on this event can see it." });
      await load();
    } catch {
      setProblem("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const report = async (id: string) => {
    setReported((prev) => [...prev, id]);
    try {
      await fetch("/api/event-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report", slug, id, reporter: identity }),
      });
      await load();
    } catch {
      /* the report can be re-sent after a reload */
    }
  };

  const loadAdmin = async () => {
    setAdminNote(null);
    try {
      const response = await fetch(`/api/event-threads?slug=${encodeURIComponent(slug)}`, {
        headers: { "x-admin-token": adminToken },
        cache: "no-store",
      });
      const data = (await response.json()) as { ok: boolean; thread?: Thread };
      if (data.ok && data.thread) setAdminThread(data.thread);
      else setAdminNote("That token wasn't accepted.");
    } catch {
      setAdminNote("Couldn't reach the server.");
    }
  };

  const admin = async (action: string, extra: Record<string, unknown>) => {
    setAdminNote(null);
    try {
      const response = await fetch("/api/event-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ action, slug, ...extra }),
      });
      const data = (await response.json()) as { ok: boolean; reason?: string; thread?: Thread };
      if (data.ok && data.thread) {
        setAdminThread(data.thread);
        setAdminNote("Done.");
      } else {
        setAdminNote(`That didn't work (${data.reason ?? "unknown"}).`);
      }
      await load();
    } catch {
      setAdminNote("Couldn't reach the server.");
    }
  };

  const messages = thread?.messages ?? [];
  const locked = thread?.locked ?? false;
  const pinnedSlot = adminThread?.pinnedSlot ?? null;

  return (
    <section aria-label="Guest discussion">
      <header className="mb-3.5 flex items-center gap-2">
        <MessageSquare className="text-red size-4" />
        <h2 className="font-serif text-[1.15rem] font-semibold tracking-[-0.03em]">
          Guest discussion
        </h2>
        <span className="bg-sand-light text-muted rounded-full px-2 py-0.5 text-[0.7rem] font-semibold">
          {messages.length}
        </span>
      </header>

      {thread?.pinned ? (
        <aside className="rounded-card border-gold/60 bg-gold/[0.12] mb-3 border p-3.5">
          <p className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.1em] text-[#8f5c07] uppercase">
            <Pin className="size-3" />
            {thread.pinned.title}
          </p>
          <p className="mt-1.5 text-[0.85rem] leading-relaxed text-pretty">{thread.pinned.body}</p>
        </aside>
      ) : null}

      {locked ? (
        <p className="bg-sand-light text-muted mb-3 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[0.78rem]">
          <Lock className="size-3.5 shrink-0" />
          This conversation closed a week after the event.
        </p>
      ) : null}

      {thread === null ? (
        <p className="text-muted rounded-2xl border border-dashed border-[var(--line-strong)] px-4 py-6 text-center text-[0.82rem]">
          {loadFailed ? "The conversation couldn't load. Check your connection." : "Loading…"}
        </p>
      ) : messages.length === 0 ? (
        <p className="text-muted rounded-2xl border border-dashed border-[var(--line-strong)] px-4 py-6 text-center text-[0.82rem]">
          {upcoming
            ? "No messages yet. Say hi, coordinate rides, ask who's coming."
            : "No messages yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => {
            const isYou = mine.includes(message.id);
            return (
              <li
                key={message.id}
                className={cn(
                  "rounded-card bg-paper flex gap-3 border border-[var(--line)] p-3.5",
                  isYou &&
                    "border-red/35 bg-red/[0.035] animate-[mmg-fade-up_0.3s_var(--ease-out-soft)]",
                )}
              >
                <Avatar name={message.displayName} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[0.85rem] font-semibold">{message.displayName}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-[0.1rem] text-[0.62rem] font-bold tracking-[0.05em] uppercase",
                        message.rsvp === "going"
                          ? "bg-teal/12 text-teal-dark"
                          : "bg-sand-light text-muted",
                      )}
                    >
                      {message.rsvp === "going" ? "Going" : "Maybe"}
                    </span>
                    {isYou ? (
                      <span className="bg-espresso text-gold rounded-full px-1.5 py-[0.1rem] text-[0.62rem] font-bold tracking-[0.05em] uppercase">
                        You
                      </span>
                    ) : null}
                    <span className="text-muted ml-auto shrink-0 text-[0.7rem]">
                      {message.createdAt.startsWith("1970") ? "" : relativeTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.87rem] leading-relaxed text-pretty whitespace-pre-line">
                    {message.body}
                  </p>
                  {canPost && !isYou ? (
                    reported.includes(message.id) ? (
                      <p className="text-muted mt-1.5 text-[0.7rem]">
                        Thanks — we&rsquo;ll take a look.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void report(message.id)}
                        className="text-muted hover:text-red mt-1.5 inline-flex items-center gap-1 text-[0.7rem] font-semibold"
                      >
                        <Flag className="size-3" />
                        Report
                      </button>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {thread && !locked && hydrated ? (
        canPost ? (
          <div className="rounded-card bg-paper shadow-card mt-4 border border-[var(--line)] p-3.5">
            <div className="flex items-end gap-2.5">
              <Avatar name={displayName || "You"} size="sm" />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  // Enter posts; Shift+Enter for a line break.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                rows={2}
                maxLength={MAX_CHARS}
                placeholder={
                  upcoming
                    ? "Say hi, coordinate rides, ask who's coming…"
                    : "Share what you took away…"
                }
                aria-label="Write a message"
                className="bg-cream placeholder:text-muted/60 focus:border-red min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-[var(--line-strong)] px-3.5 py-2.5 text-[0.87rem] leading-snug focus:outline-none"
              />
              <Button
                size="icon"
                onClick={() => void submit()}
                disabled={busy || !body.trim()}
                aria-label="Post message"
              >
                <SendHorizonal />
              </Button>
            </div>
            <div className="text-muted mt-2 flex justify-between pl-[2.75rem] text-[0.7rem]">
              <span>Posting as {displayName.split(/\s+/)[0] || "Guest"}</span>
              <span className="tabular-nums">
                {body.length}/{MAX_CHARS}
              </span>
            </div>
            {problem ? (
              <p className="text-red mt-2 pl-[2.75rem] text-[0.75rem]">{problem}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] px-4 py-3.5 text-center text-[0.8rem]">
            RSVP Going or Maybe to join the conversation.
          </p>
        )
      ) : null}

      <div className="text-muted mt-4 flex items-center justify-between text-[0.68rem]">
        <span>Powered by Coach OS</span>
        <button
          type="button"
          onClick={() => setModerating((prev) => !prev)}
          className="hover:text-espresso inline-flex items-center gap-1 font-semibold"
        >
          <ShieldCheck className="size-3" />
          {moderating ? "Close moderation" : "Moderate"}
        </button>
      </div>

      {moderating ? (
        <div className="rounded-card bg-paper mt-2 border border-[var(--line-strong)] p-3.5">
          <div className="flex gap-2">
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="Moderator token"
              autoComplete="off"
              className="bg-cream placeholder:text-muted/60 focus:border-red min-w-0 flex-1 rounded-xl border border-[var(--line-strong)] px-3 py-2 text-[0.85rem] focus:outline-none"
            />
            <Button size="sm" onClick={() => void loadAdmin()} disabled={!adminToken}>
              Open
            </Button>
          </div>
          <p className="text-muted mt-1.5 text-[0.68rem]">
            The token stays on this page and is never saved.
          </p>

          {adminThread ? (
            <div className="mt-3 space-y-2">
              <div className="bg-cream flex items-center justify-between gap-2 rounded-xl px-3 py-2">
                <span className="text-[0.75rem]">
                  Partner slot: <strong>{pinnedSlot?.enabled ? "showing" : "hidden"}</strong>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pinnedSlot}
                  onClick={() =>
                    void admin("pin", {
                      pinned: pinnedSlot ? { ...pinnedSlot, enabled: !pinnedSlot.enabled } : null,
                    })
                  }
                >
                  {pinnedSlot?.enabled ? "Hide" : "Show"}
                </Button>
              </div>
              {adminThread.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-xl border border-[var(--line)] px-3 py-2 text-[0.75rem]",
                    message.hidden && "opacity-60",
                  )}
                >
                  <p>
                    <strong>{message.displayName}</strong>
                    {message.reports ? ` · ${message.reports} report(s)` : ""}
                    {message.hidden ? " · hidden" : ""}
                    {message.muted ? " · muted" : ""}
                  </p>
                  <p className="text-muted truncate">{message.body}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void admin(message.hidden ? "unhide" : "hide", { id: message.id })
                      }
                    >
                      {message.hidden ? "Unhide" : "Hide"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void admin(message.muted ? "unmute" : "mute", {
                          id: message.id,
                          minutes: 24 * 60,
                        })
                      }
                    >
                      {message.muted ? "Unmute" : "Mute 24h"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {adminNote ? <p className="text-muted mt-2 text-[0.72rem]">{adminNote}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
