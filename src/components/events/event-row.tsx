import { Camera, ChevronRight, Play, Users } from "lucide-react";
import Link from "next/link";
import { formatDayNumber, formatMonthAbbr, formatTime } from "@/lib/format";
import type { EventRow as EventRowData } from "@/lib/rows";
import type { Series } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCENT_TEXT: Record<Series["accent"], string> = {
  red: "text-red",
  teal: "text-teal-dark",
  mango: "text-[#8f5c07]",
};

/**
 * The dense list row the app leans on everywhere events are listed. Everything
 * you need to decide — when, where, how full — on one tappable line, so a month
 * of events fits on a screen instead of a scroll.
 *
 * Every line below the title is conditional: feed events often have no time, no
 * venue and no headcount yet, and a row of placeholders reads worse than a
 * shorter row.
 */
export function EventRow({ event, className }: { event: EventRowData; className?: string }) {
  const accent = ACCENT_TEXT[event.accent ?? "red"];
  const place = [event.city, event.state].filter(Boolean).join(", ");
  const time = formatTime(event.startTime);

  return (
    <Link href={`/events/${event.slug}`} className={cn("mmg-row mmg-press", className)}>
      <span className="bg-sand-light grid size-[3.1rem] shrink-0 place-content-center rounded-2xl text-center leading-none">
        <span className={cn("text-[0.58rem] font-bold tracking-[0.12em]", accent)}>
          {formatMonthAbbr(event.date)}
        </span>
        <span className="mmg-display mt-0.5 text-[1.4rem]">{formatDayNumber(event.date)}</span>
      </span>

      <span className="min-w-0 flex-1">
        {event.kind ? (
          <span className={cn("block text-[0.62rem] font-bold tracking-[0.1em] uppercase", accent)}>
            {event.kind}
          </span>
        ) : null}
        <span className="mt-0.5 line-clamp-2 text-[0.88rem] leading-snug font-semibold">
          {event.title}
        </span>
        <span className="text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.73rem]">
          {time ? <span>{time}</span> : null}
          {time && place ? <span aria-hidden>·</span> : null}
          {place ? <span className="truncate">{place}</span> : null}
          {event.attendingCount ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              {event.attendingCount}
            </span>
          ) : null}
          {event.photoCount ? (
            <span className="inline-flex items-center gap-1">
              <Camera className="size-3" />
              {event.photoCount}
            </span>
          ) : null}
          {event.hasVideo ? <Play className="size-3 fill-current" /> : null}
        </span>
      </span>

      <ChevronRight className="text-muted/60 size-4 shrink-0" />
    </Link>
  );
}
