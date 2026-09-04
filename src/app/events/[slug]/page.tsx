import { CalendarDays, ExternalLink, Instagram, MapPin, Play, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendeeList } from "@/components/events/attendee-list";
import { EventActions } from "@/components/events/event-actions";
import { EventArt } from "@/components/events/event-art";
import { PhotoGallery } from "@/components/events/photo-gallery";
import { SeriesPill, Tag } from "@/components/events/series-pill";
import { CommentThread } from "@/components/community/comment-thread";
import { HostCard } from "@/components/shared/host-card";
import { PartnerWall } from "@/components/shared/partner-wall";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { List, ListRow } from "@/components/ui/list";
import { Segmented, type Segment } from "@/components/ui/segmented";
import {
  allEvents,
  getEvent,
  getHost,
  getPartners,
  getSeries,
  isUpcoming,
  site,
  upcomingEvents,
} from "@/lib/content";
import {
  formatFullDate,
  formatShortDate,
  formatTimeRange,
  mapsUrl,
  relativeToToday,
  venueLine,
} from "@/lib/format";
import { eventCommentKey } from "@/lib/keys";
import type { AgendaItem } from "@/lib/types";

export function generateStaticParams() {
  return allEvents.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      type: "article",
    },
  };
}

function Agenda({ agenda }: { agenda: AgendaItem[] }) {
  return (
    <ol className="mmg-list">
      {agenda.map((item, index) => (
        <li key={`${item.time}-${item.label}`} className="flex gap-3.5 p-3.5">
          <span className="text-red w-[3.4rem] shrink-0 pt-0.5 text-[0.78rem] font-bold tabular-nums">
            {item.time}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.87rem] font-semibold">{item.label}</p>
            {item.detail ? (
              <p className="text-muted mt-0.5 text-[0.78rem] leading-snug">{item.detail}</p>
            ) : null}
          </div>
          <span className="text-muted/50 shrink-0 pt-1 text-[0.7rem] font-bold tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const series = getSeries(event.seriesId);
  const host = getHost(event.hostId);
  const sponsors = getPartners(event.sponsorIds);
  const upcoming = isUpcoming(event);
  const nextEvent = upcomingEvents.find((candidate) => candidate.slug !== event.slug);
  const spotsLeft = Math.max(0, event.capacity - event.attendingCount);

  const about = (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {event.description.map((paragraph) => (
          <p
            key={paragraph}
            className="text-muted max-w-2xl text-[0.87rem] leading-relaxed text-pretty lg:text-[1rem]"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {event.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ) : null}

      {/* A past event's run of show is reference material, not the headline. */}
      {!upcoming && event.agenda?.length ? (
        <Disclosure summary="How the evening ran" sub={`${event.agenda.length} moments`}>
          <Agenda agenda={event.agenda} />
        </Disclosure>
      ) : null}

      {host ? (
        <div className="lg:hidden">
          <HostCard host={host} compact />
        </div>
      ) : null}

      {sponsors.length ? (
        <div>
          <h2 className="font-serif text-[1.1rem] font-semibold tracking-[-0.03em]">
            {upcoming ? "Sponsored by" : "Sponsor recognition"}
          </h2>
          <p className="text-muted mt-0.5 mb-2.5 text-[0.79rem]">
            {upcoming
              ? "These partners make the evening possible."
              : "Partners whose support made this gathering possible."}
          </p>
          <PartnerWall partners={sponsors} columns={4} />
          <Button asChild variant="outline" block className="mt-2.5 lg:w-auto">
            <Link href="/sponsor">Sponsor a future event</Link>
          </Button>
        </div>
      ) : null}

      {nextEvent ? (
        <Link
          href={`/events/${nextEvent.slug}`}
          className="mmg-press rounded-card bg-espresso text-cream shadow-mmg flex items-center gap-3 p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="mmg-eyebrow text-gold">See the next gathering</p>
            <p className="mt-1 font-serif text-[1.1rem] leading-tight font-semibold tracking-[-0.03em]">
              {nextEvent.title}
            </p>
            <p className="text-cream/65 mt-1 text-[0.76rem]">
              {formatFullDate(nextEvent.date)} · {nextEvent.venue.city}
            </p>
          </div>
        </Link>
      ) : null}

      <div className="space-y-1.5 text-center lg:text-left">
        {event.eventbriteUrl ? (
          <a
            href={event.eventbriteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-espresso inline-flex items-center gap-1.5 text-[0.78rem] font-semibold"
          >
            Also listed on Eventbrite
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
        <p className="text-muted/70 text-[0.7rem] leading-relaxed">
          Questions? Call MMG at {site.phone}.
        </p>
      </div>
    </div>
  );

  const recapPanel = event.recap ? (
    <div>
      <p className="mmg-eyebrow">Recap</p>
      <h2 className="mt-1 font-serif text-[1.35rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance lg:text-[2rem]">
        {event.recap.headline}
      </h2>

      {event.recap.stats?.length ? (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {event.recap.stats.map((stat) => (
            <li
              key={stat.label}
              className="bg-paper shadow-card rounded-2xl border border-[var(--line)] px-2 py-2.5 text-center"
            >
              <p className="mmg-display text-red text-[1.45rem] lg:text-[2.2rem]">{stat.value}</p>
              <p className="text-muted mt-0.5 text-[0.66rem] leading-tight font-semibold">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3.5 space-y-2.5">
        {event.recap.body.map((paragraph) => (
          <p
            key={paragraph}
            className="text-muted max-w-2xl text-[0.87rem] leading-relaxed text-pretty lg:text-[1rem]"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {event.recap.videoUrl ? (
        <Button asChild variant="espresso" block className="mt-3.5 lg:w-auto">
          <a href={event.recap.videoUrl} target="_blank" rel="noreferrer">
            <Play className="fill-current" />
            {event.recap.videoLabel ?? "Watch the recap"}
            <Instagram />
          </a>
        </Button>
      ) : null}

      {event.recap.photos.length ? (
        <div className="mt-4">
          <h3 className="text-muted mb-2.5 text-[0.68rem] font-bold tracking-[0.12em] uppercase">
            Photo gallery
          </h3>
          <PhotoGallery photos={event.recap.photos} />
        </div>
      ) : null}
    </div>
  ) : null;

  /*
    Four tabs instead of nine stacked sections. Every panel is still in the
    HTML — the switcher only decides which one owns the screen.
  */
  const segments: Segment[] = [
    ...(recapPanel ? [{ value: "recap", label: "Recap", content: recapPanel }] : []),
    { value: "about", label: "About", content: about },
    ...(upcoming && event.agenda?.length
      ? [
          {
            value: "agenda",
            label: "Agenda",
            content: (
              <div>
                <h2 className="mb-3 font-serif text-[1.1rem] font-semibold tracking-[-0.03em]">
                  How the evening runs
                </h2>
                <Agenda agenda={event.agenda} />
              </div>
            ),
          },
        ]
      : []),
    {
      value: "people",
      label: "People",
      count: event.attendingCount,
      content: <AttendeeList event={event} />,
    },
    {
      value: "talk",
      label: "Talk",
      count: event.comments.length,
      content: (
        <div id="discussion">
          <CommentThread
            storageKey={eventCommentKey(event.slug)}
            seeded={event.comments}
            placeholder={
              upcoming ? "Ask a question about this event…" : "Share what you took away…"
            }
            emptyLabel={
              upcoming
                ? "No questions yet. Ask the first one — Andrew answers these."
                : "No comments yet. Say hello to someone you met."
            }
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <AppBar
        title={event.title}
        subtitle={`${formatShortDate(event.date)} · ${event.venue.city}`}
        back="/events"
      />

      <main className="pb-actionbar">
        <div className="mmg-shell pt-3 lg:pt-10">
          {/*
            One stack on phones, two columns on desktop. Source order is the
            mobile order (art, title, facts, then the tabbed content); explicit
            grid placement moves the facts panel into a sticky right rail on
            wide screens.
          */}
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-12">
            {/* Artwork */}
            <div className="rounded-card shadow-card relative overflow-hidden border border-[var(--line)] lg:col-start-2 lg:row-start-1">
              <EventArt
                event={event}
                series={series}
                priority
                overlay
                className="aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-[16/11]"
              />
              <div
                aria-hidden
                className="from-espresso/80 absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                <span className="bg-paper/95 text-red rounded-full px-2.5 py-1 text-[0.64rem] font-bold tracking-[0.08em] uppercase backdrop-blur">
                  {relativeToToday(event.date)}
                </span>
                {upcoming && spotsLeft <= 30 && spotsLeft > 0 ? (
                  <span className="bg-gold text-espresso rounded-full px-2.5 py-1 text-[0.64rem] font-bold tracking-[0.06em] uppercase">
                    {spotsLeft} spots left
                  </span>
                ) : null}
              </div>
            </div>

            {/* Title */}
            <div className="pt-3.5 lg:col-start-1 lg:row-start-1 lg:flex lg:h-full lg:flex-col lg:justify-center lg:pt-0">
              {/* Wrapped so the pill keeps its own width inside the flex column. */}
              {series ? (
                <div>
                  <SeriesPill series={series} />
                </div>
              ) : null}
              <h1 className="mt-2 font-serif text-[1.6rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance lg:text-[3rem]">
                {event.title}
              </h1>
              <p className="text-muted mt-2 max-w-2xl text-[0.86rem] leading-snug text-pretty lg:mt-3 lg:text-[1.05rem] lg:leading-relaxed">
                {event.summary}
              </p>
            </div>

            {/* The three facts that decide whether you go — never behind a tab. */}
            <div className="pt-3.5 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-2 lg:pt-8">
              <List>
                <ListRow
                  icon={CalendarDays}
                  label={formatFullDate(event.date)}
                  sub={formatTimeRange(event.startTime, event.endTime)}
                  chevron={false}
                />
                <ListRow
                  icon={MapPin}
                  href={mapsUrl(event.venue)}
                  external
                  label={event.venue.name}
                  sub={`${event.venue.address}, ${venueLine(event.venue)} ${event.venue.zip}`}
                  trailing={
                    <span className="text-red inline-flex shrink-0 items-center gap-1 text-[0.74rem] font-semibold">
                      Open in Maps
                      <ExternalLink className="size-3" />
                    </span>
                  }
                  chevron={false}
                />
                <ListRow
                  icon={Users}
                  label={`${event.attendingCount} going`}
                  sub={
                    upcoming
                      ? spotsLeft > 0
                        ? `${spotsLeft} of ${event.capacity} spots left`
                        : "At capacity — join the waitlist by calling"
                      : `Capacity ${event.capacity}`
                  }
                  chevron={false}
                />
              </List>

              {/* Phones get these in the bar pinned above the tab bar instead. */}
              <div className="hidden pt-3.5 lg:block">
                <EventActions event={event} isPast={!upcoming} />
              </div>

              {host ? (
                <div className="hidden pt-3.5 lg:block">
                  <HostCard host={host} compact />
                </div>
              ) : null}
            </div>

            {/* Tabbed content */}
            <div className="lg:col-start-1 lg:row-start-2">
              <Segmented
                segments={segments}
                listClassName="-mx-4 px-4 lg:mx-0 lg:px-0"
                panelClassName="pt-4"
              />
            </div>
          </div>
        </div>

        {/* Thumb-reach action bar — the one thing you came here to do. */}
        <div
          data-action-bar
          className="bg-paper/94 fixed inset-x-0 z-30 border-t border-[var(--line)] backdrop-blur-xl lg:hidden"
          style={{ bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto max-w-2xl px-4 py-2.5">
            <EventActions event={event} isPast={!upcoming} layout="bar" />
          </div>
        </div>
      </main>
    </>
  );
}
