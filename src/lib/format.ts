import { DEMO_TODAY } from "./today";

const TZ = "America/New_York";

function eventDate(isoDate: string, time = "12:00"): Date {
  // Content dates are event-local (Florida). Anchoring to -04:00 keeps
  // rendering stable regardless of where the viewer's browser is.
  return new Date(`${isoDate}T${time}:00-04:00`);
}

export function formatDate(
  isoDate: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" },
): string {
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: TZ }).format(eventDate(isoDate));
}

export function formatShortDate(isoDate: string): string {
  return formatDate(isoDate, { weekday: "short", month: "short", day: "numeric" });
}

export function formatFullDate(isoDate: string): string {
  return formatDate(isoDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function formatMonthAbbr(isoDate: string): string {
  return formatDate(isoDate, { month: "short" }).toUpperCase();
}

export function formatDayNumber(isoDate: string): string {
  return formatDate(isoDate, { day: "numeric" });
}

/** "6:00 PM" from a 24h "18:00". */
export function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}:00 ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** "in 3 days" / "2 weeks ago" — relative to the pinned demo date. */
export function relativeToToday(isoDate: string): string {
  const days = Math.round((eventDate(isoDate).getTime() - DEMO_TODAY.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 0) {
    if (days < 7) return `In ${days} days`;
    if (days < 30) return `In ${Math.round(days / 7)} weeks`;
    return `In ${Math.round(days / 30)} months`;
  }
  const ago = Math.abs(days);
  if (ago < 7) return `${ago} days ago`;
  if (ago < 30) return `${Math.round(ago / 7)} weeks ago`;
  if (ago < 365) return `${Math.round(ago / 30)} months ago`;
  return `${Math.round(ago / 365)} years ago`;
}

/** Relative time for comment timestamps. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  // Comments posted live in the demo compare against the real clock; seeded
  // ones sit in the pinned timeline, so use whichever reference is later.
  const reference = Math.max(now.getTime(), DEMO_TODAY.getTime());
  const seconds = Math.round((reference - then) / 1000);

  if (seconds < 45) return "Just now";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`;
  const days = Math.round(seconds / 86_400);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_TONES = [
  "bg-red text-cream",
  "bg-teal text-cream",
  "bg-mango text-espresso",
  "bg-espresso text-gold",
  "bg-coral text-cream",
  "bg-teal-dark text-cream",
  "bg-red-dark text-cream",
  "bg-sand text-espresso",
] as const;

/** Stable per-person color so the same name always gets the same avatar. */
export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function mapsUrl(venue: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}): string {
  const query = `${venue.name}, ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`;
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

export function venueLine(venue: { city: string; state: string }): string {
  return `${venue.city}, ${venue.state}`;
}
