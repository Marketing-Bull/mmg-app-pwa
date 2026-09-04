/**
 * Live content feed from the MMG marketing site.
 *
 * millersmarketinggroup.com publishes its editor-managed events and sponsors at
 * `/api/events` and `/api/sponsors` (Vercel Blob behind them). This module is the
 * only place that knows about those endpoints: it fetches them, validates the
 * shape defensively, and maps them onto the app's own types.
 *
 * Why fetch rather than commit a copy: when Andrew publishes an event on the
 * marketing site it has to show up here without anyone redeploying this app.
 * Requests are revalidated on an interval, so pages stay static and fast but
 * pick up new content on their own.
 *
 * Failure is expected and survivable. If the feed is unreachable, malformed, or
 * empty, callers fall back to `content/feed/*.seed.json` — a committed snapshot
 * of the same real data. Stale-but-real beats a blank page, and it means the
 * demo link never dies because of someone else's outage.
 */

import eventsSeed from "../../content/feed/events.seed.json";
import sponsorsSeed from "../../content/feed/sponsors.seed.json";
import { partners as localPartners } from "./content";
import type { Image, MMGEvent, Partner, Venue } from "./types";

const ORIGIN = "https://www.millersmarketinggroup.com";

/** How long a fetched feed is served before Next revalidates it in the background. */
const REVALIDATE_SECONDS = 300;

/** Shape published by the marketing site. Every field is optional by design. */
interface FeedEvent {
  id?: string;
  title?: string;
  status?: string;
  date?: string;
  cadence?: string;
  city?: string;
  venue?: string;
  type?: string;
  summary?: string;
  image?: string;
  registerUrl?: string;
  registerLabel?: string;
  featured?: boolean;
  recapUrl?: string;
  recapImage?: string;
  recapLabel?: string;
  recapMeta?: string;
}

interface FeedSponsor {
  id?: string;
  name?: string;
  logo?: string;
  bg?: string;
  url?: string;
  tier?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Pull an array off a feed payload without trusting anything about it. A feed
 * that answers 200 with the wrong shape is treated exactly like one that is down.
 */
function readList<T>(payload: unknown, key: string): T[] {
  if (!isRecord(payload)) return [];
  const list = payload[key];
  return Array.isArray(list) ? (list.filter(isRecord) as T[]) : [];
}

/**
 * Feed image paths are relative to the marketing site ("assets/events/..."), but
 * editor uploads land on Vercel Blob as absolute URLs. Accept both; reject
 * anything that isn't plainly http(s) so a bad value can't become a javascript:
 * or data: URL in an <img src>.
 */
function absoluteUrl(value: string | undefined): string | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return undefined; // Some other scheme — drop it.
  return `${ORIGIN}/${raw.replace(/^\/+/, "")}`;
}

function image(src: string | undefined, alt: string): Image | undefined {
  const url = absoluteUrl(src);
  return url ? { src: url, alt } : undefined;
}

/** Only http(s) links are worth rendering as a button. */
function safeLink(value: string | undefined): string | undefined {
  const raw = String(value ?? "").trim();
  return /^https?:\/\//i.test(raw) ? raw : undefined;
}

/** `YYYY-MM-DD` prefix of a date or full ISO timestamp; null when unparseable. */
function dateKey(value: string | undefined): string | null {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/**
 * Times aren't a field in the feed — some summaries mention one in prose
 * ("... at JOEY Aventura, 6:00-9:00 PM"), most don't. Lift a range when it is
 * unambiguously there and leave it empty otherwise, so the UI omits the time
 * rather than inventing one for a real event people plan around.
 */
function timeRange(summary: string): { startTime: string; endTime: string } {
  const empty = { startTime: "", endTime: "" };
  const match = summary.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
  );
  if (!match) return empty;

  const [, sh, sm = "00", sMer, eh, em = "00", eMer] = match;
  // A bare start meridiem ("6:00-9:00 PM") takes the end's.
  const to24 = (hour: string, meridiem: string) => {
    let h = Number(hour);
    if (h < 1 || h > 12) return null;
    if (/pm/i.test(meridiem) && h !== 12) h += 12;
    if (/am/i.test(meridiem) && h === 12) h = 0;
    return String(h).padStart(2, "0");
  };
  const start = to24(sh, sMer || eMer);
  const end = to24(eh, eMer);
  if (!start || !end) return empty;
  return { startTime: `${start}:${sm}`, endTime: `${end}:${em}` };
}

/**
 * The feed has a venue name and a city, never a street address. Leave the
 * address fields blank rather than guessing — `formatAddress` and the Maps link
 * already handle a venue that only knows its name and city.
 */
function venueFrom(feed: FeedEvent): Venue {
  return {
    name: String(feed.venue ?? "").trim(),
    address: "",
    city: String(feed.city ?? "").trim(),
    state: String(feed.city ?? "").trim() ? "FL" : "",
    zip: "",
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Map a feed event onto the app's event type.
 *
 * Fields the feed cannot know (agenda, attendee roster, seeded comments) are
 * deliberately left empty. RSVPs and comments made in the app are layered on top
 * at runtime by the store, so an event starting with an empty roster still fills
 * in as people use the demo.
 */
function toEvent(feed: FeedEvent): MMGEvent | null {
  const title = String(feed.title ?? "").trim();
  const date = dateKey(feed.date);
  if (!title || !date) return null; // Undated series entries are handled separately.

  const slug = String(feed.id ?? "").trim() || slugify(title);
  const summary = String(feed.summary ?? "").trim();
  const venue = venueFrom(feed);
  const type = String(feed.type ?? "").trim();

  const recapVideo = safeLink(feed.recapUrl);
  const recapPhoto = image(feed.recapImage, `${title} recap`);

  return {
    slug,
    title,
    seriesId: null,
    date,
    ...timeRange(summary),
    venue,
    summary,
    description: summary ? [summary] : [],
    flyer: image(feed.image, `${title} flyer`),
    hostId: "andrew-miller",
    // The feed doesn't say which sponsors backed which event, and asserting
    // "these partners made this evening possible" from the site-wide list would
    // put words in real businesses' mouths. Left empty; the detail page shows
    // the community partner wall instead.
    sponsorIds: [],
    capacity: 0,
    attendingCount: 0,
    attendees: [],
    tags: [type, venue.city].filter(Boolean),
    comments: [],
    eventbriteUrl: safeLink(feed.registerUrl),
    // A past event only gets a recap block when there is genuinely something in
    // it — otherwise the detail page renders an empty "Recap" heading.
    recap:
      recapVideo || recapPhoto
        ? {
            headline: String(feed.recapLabel ?? "").trim() || "How it went",
            body: summary ? [summary] : [],
            photos: recapPhoto ? [recapPhoto] : [],
            videoUrl: recapVideo,
            videoLabel: String(feed.recapLabel ?? "").trim() || undefined,
          }
        : undefined,
  };
}

function toPartner(feed: FeedSponsor): Partner | null {
  const name = String(feed.name ?? "").trim();
  if (!name) return null;
  const id = String(feed.id ?? "").trim() || slugify(name);
  // The feed doesn't classify sponsors. Reuse the local category where the id
  // matches so the existing filtering keeps working, and default to vendor.
  const known = localPartners.find((partner) => partner.id === id);
  return {
    id,
    name,
    logo: image(feed.logo, name),
    category: known?.category ?? "vendor",
  };
}

async function fetchFeed(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${ORIGIN}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null; // Offline, DNS, TLS, timeout — all the same to the caller.
  }
}

export interface EventFeed {
  upcoming: MMGEvent[];
  past: MMGEvent[];
  all: MMGEvent[];
  /** Recurring programmes the feed publishes without a date. */
  series: { id: string; title: string; cadence: string; summary: string; image?: Image }[];
  /** False when the committed snapshot was used because the live feed failed. */
  live: boolean;
}

/** Today in Florida, as `YYYY-MM-DD`, so the split matches the marketing site's. */
function floridaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD.
}

export async function getEventFeed(): Promise<EventFeed> {
  const live = await fetchFeed("/api/events");
  const liveList = readList<FeedEvent>(live, "events");
  const usedLive = liveList.length > 0;
  const raw = usedLive ? liveList : readList<FeedEvent>(eventsSeed, "events");

  const dated = raw.map(toEvent).filter((event): event is MMGEvent => event !== null);

  const today = floridaToday();
  const upcoming = dated
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = dated.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const series = raw
    .filter((feed) => !dateKey(feed.date) && String(feed.title ?? "").trim())
    .map((feed) => ({
      id: String(feed.id ?? "").trim() || slugify(String(feed.title)),
      title: String(feed.title).trim(),
      cadence: String(feed.cadence ?? "").trim(),
      summary: String(feed.summary ?? "").trim(),
      image: image(feed.image, String(feed.title).trim()),
    }));

  return { upcoming, past, all: [...upcoming, ...past], series, live: usedLive };
}

export interface PartnerFeed {
  list: Partner[];
  live: boolean;
}

export async function getPartnerFeed(): Promise<PartnerFeed> {
  const live = await fetchFeed("/api/sponsors");
  const liveList = readList<FeedSponsor>(live, "sponsors");
  const usedLive = liveList.length > 0;
  const raw = usedLive ? liveList : readList<FeedSponsor>(sponsorsSeed, "sponsors");

  const list = raw.map(toPartner).filter((partner): partner is Partner => partner !== null);
  return { list: list.length ? list : localPartners, live: usedLive };
}

/** Single event by slug, from whichever source the feed resolved to. */
export async function getFeedEvent(slug: string): Promise<MMGEvent | undefined> {
  const { all } = await getEventFeed();
  return all.find((event) => event.slug === slug);
}
