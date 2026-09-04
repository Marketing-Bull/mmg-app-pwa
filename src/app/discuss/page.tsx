import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar";
import { PageIntro, Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { discussionThreads } from "@/lib/content";
import { getEventFeed } from "@/lib/feed";
import { formatShortDate, relativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Discuss",
  description:
    "Community threads and event conversations across Florida's personal injury professional network.",
};

export default async function DiscussPage() {
  // Events from the live feed carry no seeded comments — every thread here is
  // started by whoever posts first — so these are entry points to the
  // conversation, ordered soonest-first, rather than a ranking by activity.
  const { upcoming, past } = await getEventFeed();
  const eventThreads = [...upcoming, ...past.slice(0, 4)];

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
            {eventThreads.map((event) => (
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
                      {formatShortDate(event.date)}
                    </span>
                  </div>

                  <h2 className="mt-2 font-serif text-[1.1rem] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
                    {event.title}
                  </h2>
                  {event.venue.city ? (
                    <p className="text-muted mt-1 text-[0.75rem]">
                      {[event.venue.city, event.venue.state].filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                  {event.summary ? (
                    <p className="text-muted mt-2 line-clamp-2 text-[0.83rem] leading-relaxed text-pretty">
                      {event.summary}
                    </p>
                  ) : null}

                  <span className="text-muted mt-3 inline-flex items-center gap-1.5 text-[0.75rem] font-medium">
                    <MessageSquare className="size-3.5" />
                    Start the conversation
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </>
  );
}
