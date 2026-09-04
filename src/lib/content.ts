import type { DiscussionThread, Host, Partner, Role, RoleId, Series, SponsorTier } from "./types";

import siteJson from "../../content/site.json";
import hostsJson from "../../content/hosts.json";
import seriesJson from "../../content/series.json";
import partnersJson from "../../content/partners.json";
import sponsorshipJson from "../../content/sponsorship.json";
import discussionsJson from "../../content/discussions.json";

export interface SiteContent {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  phone: string;
  phoneAlt: string;
  email: string;
  address: string;
  instagram: string;
  eventbrite: string;
  website: string;
  disclaimer: string;
  valueProps: { title: string; body: string }[];
  audiences: { initials: string; title: string; body: string }[];
}

export const site = siteJson as SiteContent;
export const hosts = hostsJson as Host[];
export const seriesList = seriesJson as Series[];
export const partners = partnersJson as Partner[];
export const sponsorTiers = sponsorshipJson as SponsorTier[];
export const discussionThreads = discussionsJson as DiscussionThread[];

export const roles: Role[] = [
  {
    id: "attorney",
    label: "Attorney",
    blurb: "Personal injury firms and trial attorneys",
    initials: "PI",
  },
  {
    id: "provider",
    label: "Provider",
    blurb: "Medical, imaging, chiropractic and rehab",
    initials: "MD",
  },
  {
    id: "sponsor",
    label: "Sponsor / Vendor",
    blurb: "Partners supporting the community",
    initials: "VP",
  },
];

/**
 * Events and sponsors are no longer served from this module — they come from the
 * marketing site's live feed via `src/lib/feed.ts`, so publishing an event there
 * shows it here without a redeploy.
 *
 * The sample event files under `content/events/` are left in place but are no
 * longer imported: they were written before the feed existed and are kept only
 * as a reference for the richer per-event detail (agenda, attendee roster,
 * seeded comments) that the feed does not carry.
 */

/**
 * Reference date for the seeded discussion timestamps in `discussions.json`,
 * which were authored against this point in the calendar. Event countdowns use
 * the real clock instead — see `relativeToToday`.
 */
export const DEMO_TODAY = new Date("2026-08-11T09:00:00-04:00");

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

export function roleLabel(role: RoleId): string {
  return roles.find((r) => r.id === role)?.label ?? role;
}
