import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCard, FeaturedEventCard } from "@/components/events/event-card";
import { SeriesPill } from "@/components/events/series-pill";
import { Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";
import { pastEvents, seriesList, site, upcomingEvents } from "@/lib/content";

export const metadata: Metadata = {
  title: "Upcoming events",
  description:
    "Monthly PI networking mixers, Lunch & Learns, and signature experiences across South Florida.",
};

export default function EventsPage() {
  const [featured, ...rest] = upcomingEvents;

  return (
    <>
      <AppBar title="Events" />

      <main className="pb-tabbar">
        <div className="px-4 pt-4">
          <p className="mmg-eyebrow">Upcoming events</p>
          <h1 className="mt-1.5 font-serif text-[2rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
            Come meet the personal injury community.
          </h1>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-muted text-pretty">
            MMG events are designed to make professional networking feel natural. Expect a
            welcoming room, real conversation, and an experience people enjoy returning to.
          </p>
        </div>

        {featured ? (
          <Section eyebrow="Next up" className="pt-6">
            <FeaturedEventCard event={featured} priority />
          </Section>
        ) : null}

        {rest.length > 0 ? (
          <Section title="Everything else on the calendar" className="pt-0">
            <ul className="space-y-2.5">
              {rest.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section eyebrow="The rhythm" title="Two series, every month.">
          <ul className="grid gap-2.5">
            {seriesList.map((series) => (
              <li
                key={series.id}
                className="rounded-card border border-[var(--line)] bg-paper p-4 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SeriesPill series={series} />
                  <span className="text-[0.72rem] font-semibold text-muted">{series.cadence}</span>
                </div>
                <p className="mt-2.5 text-[0.84rem] leading-relaxed text-muted text-pretty">
                  {series.description}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="pt-0">
          <Link
            href="/events/past"
            className="mmg-press flex items-center gap-3 rounded-card border border-[var(--line)] bg-paper p-4 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <p className="mmg-eyebrow">Past events</p>
              <p className="mt-1 font-serif text-[1.2rem] leading-tight font-semibold tracking-[-0.03em]">
                Photo recaps &amp; video highlights
              </p>
              <p className="mt-1 text-[0.78rem] text-muted">
                {pastEvents.length} gatherings in the archive
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-red" />
          </Link>
        </Section>

        <Section className="pt-0 pb-4">
          <div className="rounded-card border border-[var(--line)] bg-sand-light p-4 text-center">
            <p className="text-[0.85rem] leading-relaxed text-muted text-pretty">
              Dates are also posted on Eventbrite as they open.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={site.eventbrite} target="_blank" rel="noreferrer">
                Follow MMG on Eventbrite
              </a>
            </Button>
          </div>
        </Section>
      </main>
    </>
  );
}
