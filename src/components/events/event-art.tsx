import Image from "next/image";
import { formatDayNumber, formatMonthAbbr } from "@/lib/format";
import type { MMGEvent, Series } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCENT_ART: Record<Series["accent"], { wash: string; ink: string; glow: string }> = {
  red: {
    wash: "bg-[linear-gradient(150deg,#a52e2a_0%,#76211f_55%,#3d1512_100%)]",
    ink: "text-cream",
    glow: "bg-[radial-gradient(circle_at_78%_18%,rgba(242,201,76,0.42),transparent_58%)]",
  },
  teal: {
    wash: "bg-[linear-gradient(150deg,#2e7772_0%,#195651_55%,#0d2f2c_100%)]",
    ink: "text-cream",
    glow: "bg-[radial-gradient(circle_at_78%_18%,rgba(234,219,196,0.4),transparent_58%)]",
  },
  mango: {
    wash: "bg-[linear-gradient(150deg,#d99a28_0%,#a8600f_55%,#4a2a08_100%)]",
    ink: "text-cream",
    glow: "bg-[radial-gradient(circle_at_78%_18%,rgba(255,247,232,0.45),transparent_58%)]",
  },
};

/**
 * Event artwork. Uses the real flyer or recap photo when we have one, and
 * falls back to a branded plate keyed to the series color so an event with no
 * flyer yet still reads as a designed card rather than a gap.
 */
export function EventArt({
  event,
  series,
  className,
  priority,
  overlay,
  sizes = "(min-width: 640px) 42rem, 100vw",
}: {
  event: MMGEvent;
  series?: Series;
  className?: string;
  priority?: boolean;
  /**
   * Set when the caller paints its own chrome along the bottom edge. Drops the
   * plate's date/city block so the two don't stack on top of each other.
   */
  overlay?: boolean;
  sizes?: string;
}) {
  const image = event.flyer ?? event.hero ?? event.recap?.photos[0];
  const accent = ACCENT_ART[series?.accent ?? "red"];

  if (image) {
    return (
      <div className={cn("relative overflow-hidden bg-sand-light", className)}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", accent.wash, accent.ink, className)}>
      <div aria-hidden className={cn("absolute inset-0", accent.glow)} />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.16] [background-image:repeating-linear-gradient(58deg,transparent_0_13px,currentColor_13px_14px)]"
      />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[0.62rem] font-bold tracking-[0.16em] uppercase backdrop-blur-sm">
            {series?.name ?? "MMG Event"}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/brand/mmg-official-logo.webp"
            alt=""
            className="h-7 w-auto opacity-90"
          />
        </div>
        {/*
          The date lockup sits low by default. Under an overlay it moves up into
          the middle of the plate, clear of the chrome the caller paints along
          the bottom edge.
        */}
        <div className={cn("flex gap-3", overlay ? "flex-1 items-center" : "items-end justify-between")}>
          <div className="leading-none">
            <div className="text-[0.7rem] font-bold tracking-[0.2em] opacity-80">
              {formatMonthAbbr(event.date)}
            </div>
            <div className="mmg-display text-[3.4rem] leading-[0.85] tracking-[-0.05em]">
              {formatDayNumber(event.date)}
            </div>
            {overlay ? (
              <div className="mt-2 text-[0.75rem] leading-tight font-semibold opacity-85">
                {event.venue.city}, {event.venue.state}
              </div>
            ) : null}
          </div>
          {overlay ? null : (
            <div className="text-right text-[0.72rem] leading-tight font-semibold opacity-85">
              {event.venue.city}
              <br />
              {event.venue.state}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
