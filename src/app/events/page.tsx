import { ArrowRight, Camera } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EventBrowser, type SeriesFilter } from "@/components/events/event-browser";
import { FeaturedEventCard } from "@/components/events/event-card";
import { SeriesPill } from "@/components/events/series-pill";
import { PageIntro } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { getSeries, pastEvents, seriesList, site, upcomingEvents } from "@/lib/content";
import { toEventRow } from "@/lib/rows";

export const metadata: Metadata = {
  title: "Upcoming events",
  description:
    "Monthly PI networking mixers, Lunch & Learns, and signature experiences across South Florida.",
};

export default function EventsPage() {
  const [featured, ...rest] = upcomingEvents;
  const upcomingRows = rest.map((event) => toEventRow(event, getSeries(event.seriesId)));
  const pastRows = pastEvents.map((event) => toEventRow(event, getSeries(event.seriesId)));

  /** Only offer a chip for a series that actually has events in that list. */
  const filtersFor = (slugs: (string | null)[]): SeriesFilter[] =>
    seriesList
      .filter((series) => slugs.includes(series.id))
      .map((series) => ({ id: series.id, label: series.name }));

  return (
    <>
      <AppBar title="Events" subtitle={`${upcomingEvents.length} upcoming`} />

      <main className="pb-tabbar">
        <PageIntro eyebrow="Upcoming events" title="Come meet the personal injury community.">
          A welcoming room, real conversation, and an experience people enjoy returning to.
        </PageIntro>

        {/*
          Upcoming, past and the series explainer used to be three page-lengths
          of scroll across two routes. They are three taps now.
        */}
        <Segmented
          panelClassName="mmg-shell pt-3 pb-3"
          segments={[
            {
              value: "upcoming",
              label: "Upcoming",
              count: upcomingEvents.length,
              content: (
                <>
                  {featured ? (
                    <div className="mb-3">
                      <p className="mmg-eyebrow mb-2">Next up</p>
                      <FeaturedEventCard event={featured} priority split />
                    </div>
                  ) : null}
                  <EventBrowser
                    events={upcomingRows}
                    filters={filtersFor(upcomingRows.map((row) => row.seriesId))}
                    emptyLabel="No events in that series right now."
                  />
                </>
              ),
            },
            {
              value: "past",
              label: "Past",
              count: pastEvents.length,
              content: (
                <>
                  <EventBrowser
                    events={pastRows}
                    filters={filtersFor(pastRows.map((row) => row.seriesId))}
                    emptyLabel="Nothing archived in that series yet."
                  />
                  <Link
                    href="/events/past"
                    className="mmg-press rounded-card bg-paper shadow-card mt-3 flex items-center gap-3 border border-[var(--line)] p-4"
                  >
                    <Camera className="text-red size-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.88rem] font-semibold">
                        Photo recaps &amp; video highlights
                      </span>
                      <span className="text-muted block text-[0.76rem]">
                        {pastEvents.length} gatherings in the archive
                      </span>
                    </span>
                    <ArrowRight className="text-red size-4 shrink-0" />
                  </Link>
                </>
              ),
            },
            {
              value: "series",
              label: "Series",
              content: (
                <>
                  <ul className="grid gap-2 lg:grid-cols-3 lg:gap-4">
                    {seriesList.map((series) => (
                      <li
                        key={series.id}
                        className="rounded-card bg-paper shadow-card border border-[var(--line)] p-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <SeriesPill series={series} />
                          <span className="text-muted text-[0.7rem] font-semibold">
                            {series.cadence}
                          </span>
                        </div>
                        <p className="text-muted mt-2 text-[0.82rem] leading-snug text-pretty">
                          {series.description}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-card bg-sand-light mt-3 border border-[var(--line)] p-4 text-center">
                    <p className="text-muted text-[0.83rem] leading-snug text-pretty">
                      Dates are also posted on Eventbrite as they open.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-2.5">
                      <a href={site.eventbrite} target="_blank" rel="noreferrer">
                        Follow MMG on Eventbrite
                      </a>
                    </Button>
                  </div>
                </>
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
