import type { MMGEvent } from "./types";

/** RFC 5545 wants CRLF, escaped separators, and folded long lines. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 73) {
    parts.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  if (rest.length) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

/** Local wall-clock stamp; paired with a VTIMEZONE for America/New_York. */
function localStamp(isoDate: string, time24: string): string {
  const [h, m] = time24.split(":");
  return `${isoDate.replace(/-/g, "")}T${h}${m}00`;
}

function utcStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * Embedding VTIMEZONE (rather than a UTC conversion) means the invite lands at
 * 6:00 PM Eastern in the attendee's calendar even if they're travelling.
 */
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:America/New_York",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function buildIcs(event: MMGEvent, organizerEmail: string): string {
  const { venue } = event;
  const location = `${venue.name}, ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`;
  const url = `https://millersmarketingconnects.com/events/${event.slug}`;
  const description = [event.summary, "", `Hosted by Miller's Marketing Group`, url].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Miller's Marketing Group//MMG App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${event.slug}@millersmarketinggroup.com`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART;TZID=America/New_York:${localStamp(event.date, event.startTime)}`,
    `DTEND;TZID=America/New_York:${localStamp(event.date, event.endTime)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    `URL:${escapeText(url)}`,
    `ORGANIZER;CN=Miller's Marketing Group:mailto:${organizerEmail}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.title)} starts in 2 hours`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n");
}

export function downloadIcs(event: MMGEvent, organizerEmail: string): void {
  const blob = new Blob([buildIcs(event, organizerEmail)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.slug}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoking immediately can cancel the download on some mobile browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
