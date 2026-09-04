import siteJson from "../../content/site.json";
import type { Role, RoleId } from "./types";

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

/**
 * Site-wide details and the role vocabulary, kept apart from `content.ts` so a
 * client component can read them without pulling every event JSON into the
 * browser bundle.
 */
export const site = siteJson as SiteContent;

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

export function roleLabel(role: RoleId): string {
  return roles.find((r) => r.id === role)?.label ?? role;
}
