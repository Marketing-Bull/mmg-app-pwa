"use client";

import { MessageSquare, SendHorizonal } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { roles } from "@/lib/content";
import { relativeTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Comment, RoleId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CommentThread({
  storageKey,
  seeded,
  placeholder = "Add to the conversation…",
  emptyLabel = "No comments yet. Start the thread.",
}: {
  /** `event:<slug>` or `thread:<id>` — see lib/store. */
  storageKey: string;
  seeded: Comment[];
  placeholder?: string;
  emptyLabel?: string;
}) {
  const { comments, addComment, profile, setProfile, hydrated } = useStore();
  const { toast } = useToast();

  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<RoleId>("attorney");
  const [showIdentity, setShowIdentity] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const posted = comments[storageKey] ?? [];
  const all = useMemo(
    () =>
      [...seeded, ...posted].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [seeded, posted],
  );

  const identity = profile
    ? { name: profile.name, company: profile.company, role: profile.role }
    : null;

  const submit = () => {
    const text = body.trim();
    if (!text) return;

    // First-time posters name themselves inline rather than through a modal.
    if (!identity) {
      if (!showIdentity) {
        setShowIdentity(true);
        return;
      }
      if (!name.trim()) return;
    }

    const author = identity?.name ?? name.trim();
    const authorCompany = identity?.company ?? company.trim() ?? "";
    const authorRole = identity?.role ?? role;

    addComment(storageKey, {
      id: `local-${Date.now()}`,
      author,
      role: authorRole,
      company: authorCompany || "Guest",
      body: text,
      createdAt: new Date().toISOString(),
      isYou: true,
    });

    if (!identity) {
      setProfile({
        name: author,
        email: "",
        phone: "",
        company: authorCompany,
        role: authorRole,
      });
    }

    setBody("");
    setShowIdentity(false);
    toast({ tone: "comment", title: "Posted", body: "Your comment is live on this thread." });
  };

  return (
    <section aria-label="Discussion">
      <header className="mb-3.5 flex items-center gap-2">
        <MessageSquare className="size-4 text-red" />
        <h2 className="font-serif text-[1.15rem] font-semibold tracking-[-0.03em]">
          Discussion
        </h2>
        <span className="rounded-full bg-sand-light px-2 py-0.5 text-[0.7rem] font-semibold text-muted">
          {all.length}
        </span>
      </header>

      {all.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line-strong)] px-4 py-6 text-center text-[0.82rem] text-muted">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-3">
          {all.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-card border border-[var(--line)] bg-paper p-3.5 shadow-card">
        {showIdentity && !identity ? (
          <div className="mb-3 space-y-2.5 border-b border-[var(--line)] pb-3">
            <p className="text-[0.75rem] font-semibold">Who should we credit this to?</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="rounded-xl border border-[var(--line-strong)] bg-cream px-3 py-2 text-[0.85rem] placeholder:text-muted/60 focus:border-red focus:outline-none"
              />
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Firm or practice"
                className="rounded-xl border border-[var(--line-strong)] bg-cream px-3 py-2 text-[0.85rem] placeholder:text-muted/60 focus:border-red focus:outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              {roles.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRole(option.id)}
                  aria-pressed={role === option.id}
                  className={cn(
                    "mmg-press flex-1 rounded-full px-2 py-1.5 text-[0.72rem] font-semibold transition-colors",
                    role === option.id
                      ? "bg-red text-cream"
                      : "bg-sand-light text-muted hover:text-espresso",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-end gap-2.5">
          <Avatar name={hydrated && identity ? identity.name : "You"} size="sm" />
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              // Enter posts; Shift+Enter for a line break.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={placeholder}
            aria-label="Write a comment"
            className="min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-[var(--line-strong)] bg-cream px-3.5 py-2.5 text-[0.87rem] leading-snug placeholder:text-muted/60 focus:border-red focus:outline-none"
          />
          <Button
            size="icon"
            onClick={submit}
            disabled={!body.trim() || (showIdentity && !identity && !name.trim())}
            aria-label="Post comment"
          >
            <SendHorizonal />
          </Button>
        </div>

        {hydrated && identity ? (
          <p className="mt-2 pl-[2.75rem] text-[0.7rem] text-muted">
            Posting as {identity.name}
            {identity.company ? ` · ${identity.company}` : ""}
          </p>
        ) : null}
      </div>
    </section>
  );
}

const ROLE_BADGE: Record<RoleId, string> = {
  attorney: "bg-red/10 text-red",
  provider: "bg-teal/12 text-teal-dark",
  sponsor: "bg-mango/18 text-[#8f5c07]",
};

export function CommentRow({ comment }: { comment: Comment }) {
  const label = roles.find((r) => r.id === comment.role)?.label ?? comment.role;

  return (
    <li
      className={cn(
        "flex gap-3 rounded-card border border-[var(--line)] bg-paper p-3.5",
        comment.isYou && "border-red/35 bg-red/[0.035] animate-[mmg-fade-up_0.3s_var(--ease-out-soft)]",
      )}
    >
      <Avatar name={comment.author} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[0.85rem] font-semibold">{comment.author}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-[0.1rem] text-[0.62rem] font-bold tracking-[0.05em] uppercase",
              ROLE_BADGE[comment.role],
            )}
          >
            {label}
          </span>
          {comment.isYou ? (
            <span className="rounded-full bg-espresso px-1.5 py-[0.1rem] text-[0.62rem] font-bold tracking-[0.05em] text-gold uppercase">
              You
            </span>
          ) : null}
          <span className="ml-auto shrink-0 text-[0.7rem] text-muted">
            {relativeTime(comment.createdAt)}
          </span>
        </div>
        {comment.company ? (
          <p className="text-[0.73rem] text-muted">{comment.company}</p>
        ) : null}
        <p className="mt-1.5 text-[0.87rem] leading-relaxed whitespace-pre-line text-pretty">
          {comment.body}
        </p>
      </div>
    </li>
  );
}
