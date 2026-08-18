import { Camera, Play, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EventArt } from "@/components/events/event-art";
import { SeriesPill } from "@/components/events/series-pill";
import { PageIntro, Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { getSeries, pastEvents } from "@/lib/content";
import { formatFullDate, venueLine } from "@/lib/format";

export const metadata: Metadata = {
  title: "Past events",
  description:
    "Photo recaps, video highlights, and sponsor recognition from MMG's past gatherings across Florida.",
};

export default function PastEventsPage() {
  return (
    <>
      <AppBar title="Past events" back="/events" />

      <main className="pb-tabbar">
        <PageIntro
          eyebrow="Past events"
          title="The flyer starts the invitation. The recap shows the connection."
        >
          Every past event keeps its original flyer and brings the gathering back to life through
          photos, sponsor recognition, and a short recap of what happened in the room.
        </PageIntro>

        <Section className="pt-6">
          <ul className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            {pastEvents.map((event) => {
              const series = getSeries(event.seriesId);
              const photos = event.recap?.photos ?? [];

              return (
                <li key={event.slug}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="mmg-press rounded-card bg-paper shadow-card hover:shadow-lift block overflow-hidden border border-[var(--line)] transition-shadow"
                  >
                    <div className="relative">
                      <EventArt
                        event={event}
                        series={series}
                        overlay
                        className="aspect-[16/10] w-full"
                      />
                      <div
                        aria-hidden
                        className="from-espresso/85 absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1.5 p-3">
                        <span className="bg-paper/95 text-espresso rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.08em] uppercase backdrop-blur">
                          {formatFullDate(event.date)}
                        </span>
                        {event.flyer ? (
                          <span className="bg-espresso/70 text-cream rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.06em] uppercase backdrop-blur">
                            Flyer archive
                          </span>
                        ) : null}
                        {event.recap?.videoUrl ? (
                          <span className="bg-red text-cream inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.06em] uppercase">
                            <Play className="size-3 fill-current" />
                            Video recap
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-4">
                      {series ? <SeriesPill series={series} /> : null}
                      <h2 className="mt-2 font-serif text-[1.3rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance">
                        {event.title}
                      </h2>
                      <p className="text-muted mt-1 text-[0.78rem]">
                        {event.venue.name} · {venueLine(event.venue)}
                      </p>

                      {event.recap ? (
                        <p className="text-espresso mt-2.5 font-serif text-[1rem] leading-snug tracking-[-0.02em]">
                          {event.recap.headline}
                        </p>
                      ) : null}

                      <div className="text-muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.75rem]">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          {event.attendingCount} attended
                        </span>
                        {photos.length ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Camera className="size-3.5" />
                            {photos.length} photos
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5">
                          {event.sponsorIds.length} sponsors recognized
                        </span>
                      </div>

                      {photos.length > 1 ? (
                        <div className="mt-3 flex gap-2">
                          {photos.slice(0, 3).map((photo) => (
                            <div
                              key={photo.src}
                              className="bg-sand-light relative aspect-square w-16 overflow-hidden rounded-xl"
                            >
                              <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                          ))}
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
