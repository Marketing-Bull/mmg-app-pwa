import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCard, FeaturedEventCard } from "@/components/events/event-card";
import { SeriesPill } from "@/components/events/series-pill";
import { PageIntro, Section } from "@/components/shared/section";
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
        <PageIntro eyebrow="Upcoming events" title="Come meet the personal injury community.">
          MMG events are designed to make professional networking feel natural. Expect a welcoming
          room, real conversation, and an experience people enjoy returning to.
        </PageIntro>

        {featured ? (
          <Section eyebrow="Next up" className="pt-6">
            <FeaturedEventCard event={featured} priority split />
          </Section>
        ) : null}

        {rest.length > 0 ? (
          <Section title="Everything else on the calendar" className="pt-0">
            <ul className="grid gap-2.5 lg:grid-cols-2 lg:gap-4">
              {rest.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section eyebrow="The rhythm" title="Two series, every month.">
          <ul className="grid gap-2.5 lg:grid-cols-3 lg:gap-4">
            {seriesList.map((series) => (
              <li
                key={series.id}
                className="rounded-card bg-paper shadow-card border border-[var(--line)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SeriesPill series={series} />
                  <span className="text-muted text-[0.72rem] font-semibold">{series.cadence}</span>
                </div>
                <p className="text-muted mt-2.5 text-[0.84rem] leading-relaxed text-pretty">
                  {series.description}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="pt-0">
          <Link
            href="/events/past"
            className="mmg-press rounded-card bg-paper shadow-card flex items-center gap-3 border border-[var(--line)] p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="mmg-eyebrow">Past events</p>
              <p className="mt-1 font-serif text-[1.2rem] leading-tight font-semibold tracking-[-0.03em]">
                Photo recaps &amp; video highlights
              </p>
              <p className="text-muted mt-1 text-[0.78rem]">
                {pastEvents.length} gatherings in the archive
              </p>
            </div>
            <ArrowRight className="text-red size-5 shrink-0" />
          </Link>
        </Section>

        <Section className="pt-0 pb-4">
          <div className="rounded-card bg-sand-light border border-[var(--line)] p-4 text-center">
            <p className="text-muted text-[0.85rem] leading-relaxed text-pretty">
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
