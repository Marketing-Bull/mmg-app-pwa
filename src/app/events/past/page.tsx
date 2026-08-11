import { Camera, Play, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EventArt } from "@/components/events/event-art";
import { SeriesPill } from "@/components/events/series-pill";
import { Section } from "@/components/shared/section";
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
        <div className="px-4 pt-4">
          <p className="mmg-eyebrow">Past events</p>
          <h1 className="mt-1.5 font-serif text-[2rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
            The flyer starts the invitation. The recap shows the connection.
          </h1>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-muted text-pretty">
            Every past event keeps its original flyer and brings the gathering back to life through
            photos, sponsor recognition, and a short recap of what happened in the room.
          </p>
        </div>

        <Section className="pt-6">
          <ul className="space-y-4">
            {pastEvents.map((event) => {
              const series = getSeries(event.seriesId);
              const photos = event.recap?.photos ?? [];

              return (
                <li key={event.slug}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="mmg-press block overflow-hidden rounded-card border border-[var(--line)] bg-paper shadow-card transition-shadow hover:shadow-lift"
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
                        className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-espresso/85 to-transparent"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1.5 p-3">
                        <span className="rounded-full bg-paper/95 px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.08em] text-espresso uppercase backdrop-blur">
                          {formatFullDate(event.date)}
                        </span>
                        {event.flyer ? (
                          <span className="rounded-full bg-espresso/70 px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.06em] text-cream uppercase backdrop-blur">
                            Flyer archive
                          </span>
                        ) : null}
                        {event.recap?.videoUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.06em] text-cream uppercase">
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
                      <p className="mt-1 text-[0.78rem] text-muted">
                        {event.venue.name} · {venueLine(event.venue)}
                      </p>

                      {event.recap ? (
                        <p className="mt-2.5 font-serif text-[1rem] leading-snug tracking-[-0.02em] text-espresso">
                          {event.recap.headline}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.75rem] text-muted">
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
                              className="relative aspect-square w-16 overflow-hidden rounded-xl bg-sand-light"
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
