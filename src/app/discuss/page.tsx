import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar";
import { PageIntro, Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { allEvents, discussionThreads } from "@/lib/content";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Discuss",
  description:
    "Community threads and event conversations across Florida's personal injury professional network.",
};

export default function DiscussPage() {
  // Events with the liveliest threads, newest activity first.
  const eventThreads = allEvents
    .filter((event) => event.comments.length > 0)
    .map((event) => ({
      event,
      lastAt: event.comments.reduce(
        (latest, comment) => (comment.createdAt > latest ? comment.createdAt : latest),
        event.comments[0].createdAt,
      ),
    }))
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return (
    <>
      <AppBar title="Discuss" />

      <main className="pb-tabbar">
        <PageIntro eyebrow="Community" title="The conversation keeps going between events.">
          Ask a question, share what worked, or introduce yourself before you walk into a room. No
          account needed — just post.
        </PageIntro>

        <Section eyebrow="Community threads" title="Open discussions" className="pt-6">
          <ul className="grid gap-2.5 lg:grid-cols-2 lg:gap-4">
            {discussionThreads.map((thread) => {
              const last = thread.comments[thread.comments.length - 1];
              return (
                <li key={thread.id}>
                  <Link
                    href={`/discuss/${thread.id}`}
                    className="mmg-press rounded-card bg-paper shadow-card hover:shadow-lift block border border-[var(--line)] p-4 transition-shadow"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-sand-light text-muted rounded-full px-2.5 py-[0.2rem] text-[0.65rem] font-bold tracking-[0.08em] uppercase">
                        {thread.topic}
                      </span>
                      <span className="text-muted ml-auto shrink-0 text-[0.7rem]">
                        {relativeTime(last?.createdAt ?? thread.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-2 font-serif text-[1.2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">
                      {thread.title}
                    </h2>
                    <p className="text-muted mt-1.5 line-clamp-2 text-[0.83rem] leading-relaxed text-pretty">
                      {thread.body}
                    </p>

                    <div className="mt-3 flex items-center gap-2.5">
                      <AvatarStack
                        names={[thread.author, ...thread.comments.map((c) => c.author)]}
                        max={4}
                      />
                      <span className="text-muted inline-flex items-center gap-1.5 text-[0.75rem] font-medium">
                        <MessageSquare className="size-3.5" />
                        {thread.comments.length}{" "}
                        {thread.comments.length === 1 ? "reply" : "replies"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section eyebrow="Event threads" title="Talking about specific events">
          <ul className="grid gap-2.5 lg:grid-cols-2 lg:gap-4">
            {eventThreads.map(({ event, lastAt }) => (
              <li key={event.slug}>
                <Link
                  href={`/events/${event.slug}#discussion`}
                  className="mmg-press rounded-card bg-paper shadow-card hover:shadow-lift block border border-[var(--line)] p-4 transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-red/10 text-red rounded-full px-2.5 py-[0.2rem] text-[0.65rem] font-bold tracking-[0.08em] uppercase">
                      Event
                    </span>
                    <span className="text-muted ml-auto shrink-0 text-[0.7rem]">
                      {relativeTime(lastAt)}
                    </span>
                  </div>

                  <h2 className="mt-2 font-serif text-[1.1rem] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
                    {event.title}
                  </h2>
                  <p className="text-muted mt-1 text-[0.75rem]">
                    {event.venue.city}, {event.venue.state}
                  </p>
                  <p className="text-muted mt-2 line-clamp-2 text-[0.83rem] leading-relaxed text-pretty">
                    &ldquo;{event.comments[event.comments.length - 1].body}&rdquo;
                  </p>

                  <div className="mt-3 flex items-center gap-2.5">
                    <AvatarStack names={event.comments.map((c) => c.author)} max={4} />
                    <span className="text-muted inline-flex items-center gap-1.5 text-[0.75rem] font-medium">
                      <MessageSquare className="size-3.5" />
                      {event.comments.length} {event.comments.length === 1 ? "comment" : "comments"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </>
  );
}
