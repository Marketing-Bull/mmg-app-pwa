/**
 * Browser side of the GoHighLevel capture. Fire-and-forget: it never throws,
 * never blocks the confirmation screen, and never replaces the /api/contact
 * email — it runs alongside it.
 */

import type { RoleId, RsvpStatus } from "./types";

function fire(payload: Record<string, unknown>): void {
  try {
    void fetch("/api/ghl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Survives the visitor closing the sheet or navigating away.
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Nothing to do — the email copy is the record of last resort.
  }
}

export function ghlRsvp(rsvp: {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: RoleId;
  guests: number;
  status: RsvpStatus;
  event: { slug: string; title: string; date: string };
}): void {
  fire({
    type: "rsvp",
    name: rsvp.name,
    email: rsvp.email,
    phone: rsvp.phone,
    company: rsvp.company,
    role: rsvp.role,
    guests: rsvp.guests,
    status: rsvp.status,
    eventSlug: rsvp.event.slug,
    eventTitle: rsvp.event.title,
    eventDate: rsvp.event.date,
  });
}

export function ghlLead(lead: {
  name: string;
  email: string;
  phone: string;
  company: string;
  form: "contact" | "sponsorship";
  interest: string;
  message: string;
}): void {
  fire({ type: "lead", ...lead });
}
