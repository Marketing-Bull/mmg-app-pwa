import { ChevronRight, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { AvatarStack } from "@/components/ui/avatar";
import { List } from "@/components/ui/list";
import { Segmented } from "@/components/ui/segmented";
import { allEvents, discussionThreads } from "@/lib/content";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Discuss",
  description:
    "Community threads and event conversations across Florida's personal injury professional network.",
};

/** One conversation, at a glance: who, how busy, how recent, what about. */
function ThreadRow({
  href,
  chip,
  chipClass,
  title,
  snippet,
  meta,
  names,
  replies,
  time,
}: {
  href: string;
  chip: string;
  chipClass: string;
  title: string;
  snippet: string;
  meta?: string;
  names: string[];
  replies: number;
  time: string;
}) {
  return (
    <Link href={href} className="mmg-row mmg-press items-start">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-[0.15rem] text-[0.6rem] font-bold tracking-[0.08em] uppercase ${chipClass}`}
          >
            {chip}
          </span>
          <span className="text-muted ml-auto shrink-0 text-[0.68rem]">{time}</span>
        </span>

        <span className="mt-1.5 block font-serif text-[1.02rem] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">
          {title}
        </span>
        {meta ? <span className="text-muted mt-0.5 block text-[0.72rem]">{meta}</span> : null}
        <span className="text-muted mt-1 line-clamp-1 text-[0.8rem] leading-snug">{snippet}</span>

        <span className="mt-2 flex items-center gap-2">
          <AvatarStack names={names} max={4} />
          <span className="text-muted inline-flex items-center gap-1.5 text-[0.73rem] font-medium">
            <MessageSquare className="size-3.5" />
            {replies}
          </span>
        </span>
      </span>

      <ChevronRight className="text-muted/60 mt-1 size-4 shrink-0" />
    </Link>
  );
}

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
      <AppBar
        title="Discuss"
        subtitle={`${discussionThreads.length + eventThreads.length} conversations`}
      />

      <main className="pb-tabbar">
        <PageIntro eyebrow="Community" title="The conversation keeps going.">
          Ask a question, share what worked, or introduce yourself before you walk into a room. No
          account needed — just post.
        </PageIntro>

        <Segmented
          panelClassName="mmg-shell pt-3 pb-3"
          segments={[
            {
              value: "threads",
              label: "Threads",
              count: discussionThreads.length,
              content: (
                <>
                  <h2 className="mmg-eyebrow mb-2">Open discussions</h2>
                  <List>
                    {discussionThreads.map((thread) => {
                      const last = thread.comments[thread.comments.length - 1];
                      return (
                        <ThreadRow
                          key={thread.id}
                          href={`/discuss/${thread.id}`}
                          chip={thread.topic}
                          chipClass="bg-sand-light text-muted"
                          title={thread.title}
                          snippet={thread.body}
                          names={[thread.author, ...thread.comments.map((c) => c.author)]}
                          replies={thread.comments.length}
                          time={relativeTime(last?.createdAt ?? thread.createdAt)}
                        />
                      );
                    })}
                  </List>
                </>
              ),
            },
            {
              value: "events",
              label: "Events",
              count: eventThreads.length,
              content: (
                <>
                  <h2 className="mmg-eyebrow mb-2">Talking about specific events</h2>
                  <List>
                    {eventThreads.map(({ event, lastAt }) => (
                      <ThreadRow
                        key={event.slug}
                        href={`/events/${event.slug}#discussion`}
                        chip="Event"
                        chipClass="bg-red/10 text-red"
                        title={event.title}
                        meta={`${event.venue.city}, ${event.venue.state}`}
                        snippet={`“${event.comments[event.comments.length - 1].body}”`}
                        names={event.comments.map((c) => c.author)}
                        replies={event.comments.length}
                        time={relativeTime(lastAt)}
                      />
                    ))}
                  </List>
                </>
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
