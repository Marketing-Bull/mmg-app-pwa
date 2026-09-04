import type { MMGEvent, Series } from "./types";

/**
 * The flattened shape a list row needs. Building it on the server keeps the
 * filterable client list off the full event objects — descriptions, agendas and
 * comment threads never have to cross into the browser bundle.
 */
export interface EventRow {
  slug: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  city: string;
  state: string;
  seriesId: string | null;
  seriesName?: string;
  accent?: Series["accent"];
  attendingCount: number;
  capacity: number;
  photoCount: number;
  hasVideo: boolean;
}

export function toEventRow(event: MMGEvent, series?: Series): EventRow {
  return {
    slug: event.slug,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    venueName: event.venue.name,
    city: event.venue.city,
    state: event.venue.state,
    seriesId: event.seriesId,
    seriesName: series?.name,
    accent: series?.accent,
    attendingCount: event.attendingCount,
    capacity: event.capacity,
    photoCount: event.recap?.photos.length ?? 0,
    hasVideo: Boolean(event.recap?.videoUrl),
  };
}
