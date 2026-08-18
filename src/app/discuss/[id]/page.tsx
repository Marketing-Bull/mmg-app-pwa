import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommentThread } from "@/components/community/comment-thread";
import { AppBar } from "@/components/shell/app-bar";
import { Avatar } from "@/components/ui/avatar";
import { discussionThreads, getThread, roleLabel } from "@/lib/content";
import { relativeTime } from "@/lib/format";
import { threadCommentKey } from "@/lib/keys";

export function generateStaticParams() {
  return discussionThreads.map((thread) => ({ id: thread.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const thread = getThread(id);
  if (!thread) return { title: "Thread not found" };
  return { title: thread.title, description: thread.body.slice(0, 155) };
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = getThread(id);
  if (!thread) notFound();

  return (
    <>
      <AppBar title={thread.title} back="/discuss" />

      <main className="pb-tabbar">
        <article className="mmg-shell max-w-3xl pt-4 lg:pt-12">
          <span className="bg-sand-light text-muted rounded-full px-2.5 py-[0.2rem] text-[0.65rem] font-bold tracking-[0.08em] uppercase">
            {thread.topic}
          </span>

          <h1 className="mt-2.5 font-serif text-[1.85rem] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
            {thread.title}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <Avatar name={thread.author} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.86rem] font-semibold">{thread.author}</p>
              <p className="text-muted truncate text-[0.75rem]">
                {roleLabel(thread.role)} · {thread.company}
              </p>
            </div>
            <span className="text-muted shrink-0 text-[0.72rem]">
              {relativeTime(thread.createdAt)}
            </span>
          </div>

          <p className="mt-4 text-[0.92rem] leading-relaxed text-pretty whitespace-pre-line">
            {thread.body}
          </p>
        </article>

        <div className="mmg-shell mt-7 max-w-3xl">
          <CommentThread
            storageKey={threadCommentKey(thread.id)}
            seeded={thread.comments}
            placeholder="Add your reply…"
            emptyLabel="No replies yet. Be the first."
          />
        </div>
      </main>
    </>
  );
}
