import { CalendarDays, Clock, ExternalLink, Instagram, MapPin, Play } from "lucide-react";
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
import { formatFullDate, formatTimeRange, mapsUrl, relativeToToday, venueLine } from "@/lib/format";
import { eventCommentKey } from "@/lib/keys";

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

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const series = getSeries(event.seriesId);
  const host = getHost(event.hostId);
  const sponsors = getPartners(event.sponsorIds);
  const upcoming = isUpcoming(event);
  const nextEvent = upcomingEvents.find((candidate) => candidate.slug !== event.slug);

  return (
    <>
      <AppBar title={event.title} back="/events" />

      <main className="pb-tabbar mmg-shell pt-3 lg:pt-10">
        {/*
          One stack on phones, two columns on desktop. Source order is the
          mobile order (art, title, booking panel, then the long content);
          explicit grid placement moves the booking panel into a sticky right
          rail on wide screens.
        */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-12">
          {/* Artwork */}
          <div className="rounded-card shadow-card overflow-hidden border border-[var(--line)] lg:col-start-2 lg:row-start-1">
            <EventArt
              event={event}
              series={series}
              priority
              className="aspect-[4/5] w-full sm:aspect-[16/11] lg:aspect-[5/4]"
            />
          </div>

          {/* Title */}
          <div className="pt-5 lg:col-start-1 lg:row-start-1 lg:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              {series ? <SeriesPill series={series} /> : null}
              <span className="text-muted text-[0.72rem] font-semibold">
                {relativeToToday(event.date)}
              </span>
            </div>

            <h1 className="mt-2.5 font-serif text-[2rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance lg:text-[3rem]">
              {event.title}
            </h1>
            <p className="text-muted mt-3 max-w-2xl text-[0.9rem] leading-relaxed text-pretty lg:text-[1.05rem]">
              {event.summary}
            </p>
          </div>

          {/* Booking panel — sticky rail on desktop */}
          <div className="pt-5 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-2 lg:pt-8">
            <dl className="rounded-card bg-paper shadow-card divide-y divide-[var(--line)] overflow-hidden border border-[var(--line)]">
              <div className="flex items-start gap-3 p-3.5">
                <CalendarDays className="text-red mt-0.5 size-[1.15rem] shrink-0" />
                <div>
                  <dt className="text-muted text-[0.7rem] font-bold tracking-[0.08em] uppercase">
                    Date
                  </dt>
                  <dd className="text-[0.9rem] font-semibold">{formatFullDate(event.date)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5">
                <Clock className="text-red mt-0.5 size-[1.15rem] shrink-0" />
                <div>
                  <dt className="text-muted text-[0.7rem] font-bold tracking-[0.08em] uppercase">
                    Time
                  </dt>
                  <dd className="text-[0.9rem] font-semibold">
                    {formatTimeRange(event.startTime, event.endTime)}
                  </dd>
                </div>
              </div>
              <a
                href={mapsUrl(event.venue)}
                target="_blank"
                rel="noreferrer"
                className="mmg-press hover:bg-sand-light/60 flex items-start gap-3 p-3.5"
              >
                <MapPin className="text-red mt-0.5 size-[1.15rem] shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-muted text-[0.7rem] font-bold tracking-[0.08em] uppercase">
                    Venue
                  </dt>
                  <dd className="text-[0.9rem] font-semibold">{event.venue.name}</dd>
                  <dd className="text-muted text-[0.8rem]">
                    {event.venue.address}, {venueLine(event.venue)} {event.venue.zip}
                  </dd>
                  <span className="text-red mt-1 inline-flex items-center gap-1 text-[0.75rem] font-semibold">
                    Open in Maps
                    <ExternalLink className="size-3" />
                  </span>
                </div>
              </a>
            </dl>

            <div className="pt-4">
              <EventActions event={event} isPast={!upcoming} />
            </div>

            {event.tags.length ? (
              <div className="flex flex-wrap gap-1.5 pt-4">
                {event.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            ) : null}

            {host ? (
              <div className="hidden pt-4 lg:block">
                <HostCard host={host} compact />
              </div>
            ) : null}
          </div>

          {/* Main content column */}
          <div className="lg:col-start-1 lg:row-start-2">
            <section className="space-y-3 pt-6 lg:pt-8">
              <h2 className="font-serif text-[1.15rem] font-semibold tracking-[-0.03em] lg:text-[1.6rem]">
                About this event
              </h2>
              {event.description.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-muted max-w-2xl text-[0.88rem] leading-relaxed text-pretty lg:text-[1rem]"
                >
                  {paragraph}
                </p>
              ))}
            </section>

            {event.agenda?.length ? (
              <section className="pt-7">
                <h2 className="mb-3.5 font-serif text-[1.15rem] font-semibold tracking-[-0.03em] lg:text-[1.6rem]">
                  How the evening runs
                </h2>
                <ol className="rounded-card bg-paper shadow-card overflow-hidden border border-[var(--line)]">
                  {event.agenda.map((item, index) => (
                    <li
                      key={`${item.time}-${item.label}`}
                      className="flex gap-3.5 border-b border-[var(--line)] p-3.5 last:border-0"
                    >
                      <span className="text-red w-[3.4rem] shrink-0 pt-0.5 text-[0.78rem] font-bold tabular-nums">
                        {item.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.87rem] font-semibold">{item.label}</p>
                        {item.detail ? (
                          <p className="text-muted mt-0.5 text-[0.78rem] leading-snug">
                            {item.detail}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-muted/50 shrink-0 pt-1 text-[0.7rem] font-bold tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {event.recap ? (
              <section className="pt-7">
                <p className="mmg-eyebrow">Recap</p>
                <h2 className="mt-1.5 font-serif text-[1.5rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance lg:text-[2rem]">
                  {event.recap.headline}
                </h2>

                {event.recap.stats?.length ? (
                  <ul className="mt-4 grid grid-cols-3 gap-2.5">
                    {event.recap.stats.map((stat) => (
                      <li
                        key={stat.label}
                        className="bg-paper shadow-card rounded-2xl border border-[var(--line)] px-2 py-3 text-center"
                      >
                        <p className="mmg-display text-red text-[1.6rem] lg:text-[2.2rem]">
                          {stat.value}
                        </p>
                        <p className="text-muted mt-0.5 text-[0.68rem] leading-tight font-semibold">
                          {stat.label}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4 space-y-3">
                  {event.recap.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-muted max-w-2xl text-[0.88rem] leading-relaxed text-pretty lg:text-[1rem]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {event.recap.videoUrl ? (
                  <Button asChild variant="espresso" block className="mt-4 lg:w-auto">
                    <a href={event.recap.videoUrl} target="_blank" rel="noreferrer">
                      <Play className="fill-current" />
                      {event.recap.videoLabel ?? "Watch the recap"}
                      <Instagram />
                    </a>
                  </Button>
                ) : null}

                {event.recap.photos.length ? (
                  <div className="mt-5">
                    <h3 className="text-muted mb-3 text-[0.7rem] font-bold tracking-[0.12em] uppercase">
                      Photo gallery
                    </h3>
                    <PhotoGallery photos={event.recap.photos} />
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* On desktop the host sits in the rail instead. */}
            {host ? (
              <section className="pt-7 lg:hidden">
                <HostCard host={host} compact />
              </section>
            ) : null}

            <section className="pt-7">
              <AttendeeList event={event} />
            </section>

            {sponsors.length ? (
              <section className="pt-7">
                <h2 className="mb-1 font-serif text-[1.15rem] font-semibold tracking-[-0.03em] lg:text-[1.6rem]">
                  {upcoming ? "Sponsored by" : "Sponsor recognition"}
                </h2>
                <p className="text-muted mb-3.5 text-[0.8rem]">
                  {upcoming
                    ? "These partners make the evening possible."
                    : "Partners whose support made this gathering possible."}
                </p>
                <PartnerWall partners={sponsors} columns={4} />
                <Button asChild variant="outline" block className="mt-3 lg:w-auto">
                  <Link href="/sponsor">Sponsor a future event</Link>
                </Button>
              </section>
            ) : null}

            <section className="pt-8">
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
            </section>

            {nextEvent ? (
              <section className="pt-8 pb-4">
                <Link
                  href={`/events/${nextEvent.slug}`}
                  className="mmg-press rounded-card bg-espresso text-cream shadow-mmg flex items-center gap-3 p-4 lg:p-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="mmg-eyebrow text-gold">See the next gathering</p>
                    <p className="mt-1 font-serif text-[1.15rem] leading-tight font-semibold tracking-[-0.03em] lg:text-[1.5rem]">
                      {nextEvent.title}
                    </p>
                    <p className="text-cream/65 mt-1 text-[0.78rem]">
                      {formatFullDate(nextEvent.date)} · {nextEvent.venue.city}
                    </p>
                  </div>
                </Link>
              </section>
            ) : null}

            {event.eventbriteUrl ? (
              <div className="pb-4 text-center lg:text-left">
                <a
                  href={event.eventbriteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-espresso inline-flex items-center gap-1.5 text-[0.78rem] font-semibold"
                >
                  Also listed on Eventbrite
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            ) : null}

            <p className="text-muted/70 pb-6 text-center text-[0.7rem] leading-relaxed lg:text-left">
              Questions? Call MMG at {site.phone}.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
