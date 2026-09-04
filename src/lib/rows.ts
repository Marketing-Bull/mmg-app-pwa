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
  /**
   * What kind of event this is — the series name where one is set, otherwise
   * the feed's own type ("Networking mixer", "Lunch & Learn"). Doubles as the
   * row's eyebrow and the key the filter chips group by.
   */
  kind?: string;
  accent?: Series["accent"];
  attendingCount: number;
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
    kind: series?.name ?? event.tags.find((tag) => tag.trim()),
    accent: series?.accent,
    attendingCount: event.attendingCount,
    photoCount: event.recap?.photos.length ?? 0,
    hasVideo: Boolean(event.recap?.videoUrl),
  };
}
