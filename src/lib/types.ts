export type RoleId = "attorney" | "provider" | "sponsor";

export interface Role {
  id: RoleId;
  label: string;
  /** Shown under the role in the RSVP picker. */
  blurb: string;
  initials: string;
}

export interface Image {
  src: string;
  alt: string;
}

export interface Venue {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface Attendee {
  name: string;
  role: RoleId;
  company: string;
  /** Present only on RSVPs created during this session. */
  isYou?: boolean;
}

export interface AgendaItem {
  time: string;
  label: string;
  detail?: string;
}

export interface RecapPhoto extends Image {
  caption?: string;
}

export interface Recap {
  headline: string;
  body: string[];
  photos: RecapPhoto[];
  videoUrl?: string;
  videoLabel?: string;
  stats?: { value: string; label: string }[];
}

export interface Comment {
  id: string;
  author: string;
  role: RoleId;
  company: string;
  body: string;
  /** ISO timestamp. Comments added in-session get the real current time. */
  createdAt: string;
  isYou?: boolean;
}

export interface MMGEvent {
  slug: string;
  title: string;
  /** Matches a Series id, or null for one-off events. */
  seriesId: string | null;
  /** ISO date, event-local. */
  date: string;
  startTime: string;
  endTime: string;
  venue: Venue;
  summary: string;
  description: string[];
  flyer?: Image;
  hero?: Image;
  hostId: string;
  /** Partner ids recognized at this event. */
  sponsorIds: string[];
  capacity: number;
  /** Seeded RSVP count; live RSVPs are added on top of this. */
  attendingCount: number;
  attendees: Attendee[];
  agenda?: AgendaItem[];
  recap?: Recap;
  tags: string[];
  comments: Comment[];
  eventbriteUrl?: string;
}

export interface Series {
  id: string;
  name: string;
  cadence: string;
  description: string;
  image?: Image;
  accent: "red" | "teal" | "mango";
}

export interface Host {
  id: string;
  name: string;
  title: string;
  bio: string[];
  quote?: string;
  portrait: Image;
  phone?: string;
  email?: string;
  instagram?: string;
}

export interface Partner {
  id: string;
  name: string;
  /** Optional real logo; falls back to a generated wordmark tile. */
  logo?: Image;
  category: "provider" | "attorney" | "vendor";
}

export interface SponsorTier {
  id: string;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  benefits: string[];
  /** Highlighted as the recommended tier. */
  featured?: boolean;
  spotsLeft: number;
  accent: "sand" | "gold" | "red";
}

export interface DiscussionThread {
  id: string;
  title: string;
  /** Optional event this thread hangs off. */
  eventSlug?: string;
  topic: string;
  author: string;
  role: RoleId;
  company: string;
  createdAt: string;
  body: string;
  comments: Comment[];
}
