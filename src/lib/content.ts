import { DEMO_TODAY } from "./today";
import type { DiscussionThread, Host, MMGEvent, Partner, Series, SponsorTier } from "./types";

import hostsJson from "../../content/hosts.json";
import seriesJson from "../../content/series.json";
import partnersJson from "../../content/partners.json";
import sponsorshipJson from "../../content/sponsorship.json";
import discussionsJson from "../../content/discussions.json";

// One import per file under content/events. Explicit rather than globbed so the
// bundler can see every event at build time and TypeScript can check the shape.
import lunchAndLearnAugust2026 from "../../content/events/lunch-and-learn-august-2026.json";
import piNetworkingMixerAugust2026 from "../../content/events/pi-networking-mixer-august-2026.json";
import lunchAndLearnSeptember2026 from "../../content/events/lunch-and-learn-september-2026.json";
import piNetworkingMixerSeptember2026 from "../../content/events/pi-networking-mixer-september-2026.json";
import lunchAndLearnOctober2026 from "../../content/events/lunch-and-learn-october-2026.json";
import piNetworkingMixerOctober2026 from "../../content/events/pi-networking-mixer-october-2026.json";
import piNetworkingMixerNovember2026 from "../../content/events/pi-networking-mixer-november-2026.json";
import holidaySocialDecember2026 from "../../content/events/holiday-social-december-2026.json";
import piNetworkingMixerJuly2026 from "../../content/events/pi-networking-mixer-july-2026.json";
import piBowlingMixerJune2026 from "../../content/events/pi-bowling-mixer-june-2026.json";
import piLunchAndLearnMay2026 from "../../content/events/pi-lunch-and-learn-may-2026.json";
import piMixerApril2026 from "../../content/events/pi-mixer-april-2026.json";
import piNetworkingMixerFebruary2026 from "../../content/events/pi-networking-mixer-february-2026.json";

export { site, roles, roleLabel, type SiteContent } from "./site";

export const hosts = hostsJson as Host[];
export const seriesList = seriesJson as Series[];
export const partners = partnersJson as Partner[];
export const sponsorTiers = sponsorshipJson as SponsorTier[];
export const discussionThreads = discussionsJson as DiscussionThread[];

export const allEvents: MMGEvent[] = [
  lunchAndLearnAugust2026,
  piNetworkingMixerAugust2026,
  lunchAndLearnSeptember2026,
  piNetworkingMixerSeptember2026,
  lunchAndLearnOctober2026,
  piNetworkingMixerOctober2026,
  piNetworkingMixerNovember2026,
  holidaySocialDecember2026,
  piNetworkingMixerJuly2026,
  piBowlingMixerJune2026,
  piLunchAndLearnMay2026,
  piMixerApril2026,
  piNetworkingMixerFebruary2026,
] as MMGEvent[];

function endOfEventDay(event: MMGEvent): number {
  // Compare against end-of-day so an event stays "upcoming" all day long.
  return new Date(`${event.date}T23:59:59-04:00`).getTime();
}

export function isUpcoming(event: MMGEvent): boolean {
  return endOfEventDay(event) >= DEMO_TODAY.getTime();
}

export const upcomingEvents: MMGEvent[] = allEvents
  .filter(isUpcoming)
  .sort((a, b) => a.date.localeCompare(b.date));

export const pastEvents: MMGEvent[] = allEvents
  .filter((event) => !isUpcoming(event))
  .sort((a, b) => b.date.localeCompare(a.date));

export const featuredEvent: MMGEvent | undefined = upcomingEvents[0];

export function getEvent(slug: string): MMGEvent | undefined {
  return allEvents.find((event) => event.slug === slug);
}

export function getSeries(id: string | null): Series | undefined {
  if (!id) return undefined;
  return seriesList.find((series) => series.id === id);
}

export function getHost(id: string): Host | undefined {
  return hosts.find((host) => host.id === id);
}

export function getPartners(ids: string[]): Partner[] {
  return ids
    .map((id) => partners.find((partner) => partner.id === id))
    .filter((partner): partner is Partner => Boolean(partner));
}

export function getThread(id: string): DiscussionThread | undefined {
  return discussionThreads.find((thread) => thread.id === id);
}
