import { ArrowRight, Camera } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EventBrowser } from "@/components/events/event-browser";
import { FeaturedEventCard } from "@/components/events/event-card";
import { SeriesPill } from "@/components/events/series-pill";
import { PageIntro } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { getSeries, seriesList, site } from "@/lib/content";
import { getEventFeed } from "@/lib/feed";
import { toEventRow } from "@/lib/rows";

export const metadata: Metadata = {
  title: "Upcoming events",
  description:
    "Monthly PI networking mixers, Lunch & Learns, and signature experiences across South Florida.",
};

export default async function EventsPage() {
  const { upcoming, past } = await getEventFeed();
  const [featured, ...rest] = upcoming;
  const toRow = (event: (typeof upcoming)[number]) => toEventRow(event, getSeries(event.seriesId));
  const upcomingRows = rest.map(toRow);
  const pastRows = past.map(toRow);

  return (
    <>
      <AppBar
        title="Events"
        subtitle={upcoming.length ? `${upcoming.length} upcoming` : "Dates coming soon"}
      />

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
              count: upcoming.length,
              content: featured ? (
                <>
                  <div className="mb-3">
                    <p className="mmg-eyebrow mb-2">Next up</p>
                    <FeaturedEventCard event={featured} priority split />
                  </div>
                  {upcomingRows.length ? <EventBrowser events={upcomingRows} /> : null}
                </>
              ) : (
                <div className="rounded-card bg-paper shadow-card border border-[var(--line)] p-5 text-center">
                  <p className="font-serif text-[1.2rem] leading-tight font-semibold tracking-[-0.03em]">
                    New event dates are coming soon.
                  </p>
                  <p className="text-muted mt-2 text-[0.85rem] leading-relaxed text-pretty">
                    Follow MMG on Eventbrite to be the first to see the next gathering.
                  </p>
                </div>
              ),
            },
            {
              value: "past",
              label: "Past",
              count: past.length,
              content: (
                <>
                  <EventBrowser events={pastRows} emptyLabel="Nothing archived of that kind yet." />
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
                        {past.length} gatherings in the archive
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
