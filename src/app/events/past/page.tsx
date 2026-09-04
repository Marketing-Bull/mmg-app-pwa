import { Camera, Play, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EventArt } from "@/components/events/event-art";
import { SeriesPill } from "@/components/events/series-pill";
import { PageIntro, Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { getSeries } from "@/lib/content";
import { getEventFeed } from "@/lib/feed";
import { formatFullDate, venueLine } from "@/lib/format";

export const metadata: Metadata = {
  title: "Past events",
  description:
    "Photo recaps, video highlights, and sponsor recognition from MMG's past gatherings across Florida.",
};

export default async function PastEventsPage() {
  const { past: pastEvents } = await getEventFeed();

  return (
    <>
      <AppBar title="Past events" subtitle={`${pastEvents.length} gatherings`} back="/events" />

      <main className="pb-tabbar">
        <PageIntro eyebrow="Past events" title="The flyer starts the invitation.">
          Every past event keeps its original flyer and brings the gathering back to life through
          photos, sponsor recognition, and a short recap of what happened in the room.
        </PageIntro>

        <Section className="pt-3">
          {/* Two up from the smallest tablet — an archive is for browsing. */}
          <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-5">
            {pastEvents.map((event) => {
              const series = getSeries(event.seriesId);
              const photos = event.recap?.photos ?? [];

              return (
                <li key={event.slug}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="mmg-press rounded-card bg-paper shadow-card hover:shadow-lift block h-full overflow-hidden border border-[var(--line)] transition-shadow"
                  >
                    <div className="relative">
                      <EventArt
                        event={event}
                        series={series}
                        overlay
                        className="aspect-[4/3] w-full"
                        sizes="(min-width: 1024px) 22rem, 50vw"
                      />
                      <div
                        aria-hidden
                        className="from-espresso/85 absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent"
                      />
                      {/* Only the date rides over the artwork — the badges sit
                          below it, where they don't cover the flyer. */}
                      <div className="absolute inset-x-0 bottom-0 p-2">
                        <span className="bg-paper/95 text-espresso rounded-full px-2 py-[0.15rem] text-[0.58rem] font-bold tracking-[0.06em] uppercase backdrop-blur">
                          {formatFullDate(event.date)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {series ? <SeriesPill series={series} /> : null}
                        {event.flyer ? (
                          <span className="bg-sand-light text-muted rounded-full px-2 py-[0.15rem] text-[0.58rem] font-bold tracking-[0.06em] uppercase">
                            Flyer archive
                          </span>
                        ) : null}
                        {event.recap?.videoUrl ? (
                          <span className="bg-red/10 text-red inline-flex items-center gap-1 rounded-full px-2 py-[0.15rem] text-[0.58rem] font-bold tracking-[0.06em] uppercase">
                            <Play className="size-2.5 fill-current" />
                            Video recap
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-1.5 line-clamp-3 font-serif text-[0.95rem] leading-[1.15] font-semibold tracking-[-0.03em]">
                        {event.title}
                      </h2>
                      {event.venue.name || venueLine(event.venue) ? (
                        <p className="text-muted mt-1 truncate text-[0.72rem]">
                          {[event.venue.name, venueLine(event.venue)].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}

                      {event.recap ? (
                        <p className="text-espresso mt-1.5 line-clamp-2 font-serif text-[0.9rem] leading-snug tracking-[-0.02em]">
                          {event.recap.headline}
                        </p>
                      ) : null}

                      {event.attendingCount || photos.length || event.sponsorIds.length ? (
                        <div className="text-muted mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem]">
                          {event.attendingCount ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3" />
                              {event.attendingCount}
                            </span>
                          ) : null}
                          {photos.length ? (
                            <span className="inline-flex items-center gap-1">
                              <Camera className="size-3" />
                              {photos.length}
                            </span>
                          ) : null}
                          {event.sponsorIds.length ? (
                            <span>{event.sponsorIds.length} sponsors recognized</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      </main>
    </>
  );
}
