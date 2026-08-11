import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar";
import { getSeries } from "@/lib/content";
import {
  formatDayNumber,
  formatMonthAbbr,
  formatShortDate,
  formatTimeRange,
  relativeToToday,
  venueLine,
} from "@/lib/format";
import type { MMGEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EventArt } from "./event-art";
import { SeriesPill } from "./series-pill";

/** Compact row used in lists — date chip on the left, details on the right. */
export function EventCard({ event }: { event: MMGEvent }) {
  const series = getSeries(event.seriesId);
  const attendees = event.attendees.map((a) => a.name);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="mmg-press group flex gap-3.5 rounded-card border border-[var(--line)] bg-paper p-3.5 shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="flex w-[3.4rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-sand-light py-2.5 text-espresso">
        <span className="text-[0.62rem] font-bold tracking-[0.14em] text-red">
          {formatMonthAbbr(event.date)}
        </span>
        <span className="mmg-display text-[1.75rem] leading-none">
          {formatDayNumber(event.date)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        {series ? <SeriesPill series={series} /> : null}
        <h3 className="mt-1.5 line-clamp-2 font-serif text-[1.06rem] leading-[1.15] font-semibold tracking-[-0.03em]">
          {event.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.78rem] text-muted">
          <Clock className="size-3.5 shrink-0" />
          {formatTimeRange(event.startTime, event.endTime)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[0.78rem] text-muted">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {event.venue.name} · {venueLine(event.venue)}
          </span>
        </p>

        <div className="mt-2.5 flex items-center gap-2">
          <AvatarStack names={attendees} max={4} />
          <span className="text-[0.75rem] font-medium text-muted">
            {event.attendingCount} going
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Hero treatment for the next event up. */
export function FeaturedEventCard({
  event,
  priority,
}: {
  event: MMGEvent;
  priority?: boolean;
}) {
  const series = getSeries(event.seriesId);
  const spotsLeft = Math.max(0, event.capacity - event.attendingCount);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="mmg-press group block overflow-hidden rounded-card border border-[var(--line)] bg-paper shadow-lift"
    >
      <div className="relative">
        <EventArt
          event={event}
          series={series}
          priority={priority}
          overlay
          className="aspect-[16/10] w-full"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-espresso/80 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5">
          <span className="rounded-full bg-paper/95 px-2.5 py-1 text-[0.66rem] font-bold tracking-[0.1em] text-red uppercase backdrop-blur">
            {relativeToToday(event.date)}
          </span>
          {spotsLeft <= 30 && spotsLeft > 0 ? (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[0.66rem] font-bold tracking-[0.06em] text-espresso uppercase">
              {spotsLeft} spots left
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        {series ? <SeriesPill series={series} /> : null}
        <h3 className="mt-2 font-serif text-[1.45rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance">
          {event.title}
        </h3>
        <p className="mt-2.5 line-clamp-2 text-[0.85rem] leading-relaxed text-muted text-pretty">
          {event.summary}
        </p>

        <dl className="mt-3.5 grid gap-1.5 text-[0.8rem]">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-red" />
            <dd className="font-medium">
              {formatShortDate(event.date)} · {formatTimeRange(event.startTime, event.endTime)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-red" />
            <dd className="truncate">
              {event.venue.name}, {venueLine(event.venue)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-red" />
            <dd>{event.attendingCount} going</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}

/** Fixed-width card for horizontal rails. */
export function EventRailCard({ event, className }: { event: MMGEvent; className?: string }) {
  const series = getSeries(event.seriesId);

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "mmg-press w-[15.5rem] overflow-hidden rounded-card border border-[var(--line)] bg-paper shadow-card transition-shadow hover:shadow-lift",
        className,
      )}
    >
      <EventArt
        event={event}
        series={series}
        className="aspect-[4/3] w-full"
        sizes="15.5rem"
      />
      <div className="p-3.5">
        <p className="text-[0.68rem] font-bold tracking-[0.1em] text-red uppercase">
          {formatShortDate(event.date)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-serif text-[1rem] leading-[1.15] font-semibold tracking-[-0.025em]">
          {event.title}
        </h3>
        <p className="mt-1.5 truncate text-[0.75rem] text-muted">
          {event.venue.city}, {event.venue.state}
        </p>
      </div>
    </Link>
  );
}
