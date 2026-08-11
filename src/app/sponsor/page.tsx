import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { EventRailCard } from "@/components/events/event-card";
import { PartnerWall } from "@/components/shared/partner-wall";
import { Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { TierList } from "@/components/sponsor/tier-list";
import { Button } from "@/components/ui/button";
import { partners, pastEvents, site, sponsorTiers, upcomingEvents } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sponsorship",
  description:
    "Three sponsorship tiers for MMG events — event presence, promotional visibility, and real conversations with Florida's personal injury professionals.",
};

const FAQ = [
  {
    q: "What actually happens at an event if I sponsor?",
    a: "Your logo goes on the flyer and the event page, Andrew recognizes you from the front of the room, and your team gets reserved spots. Featured and Presenting tiers also get a short speaking moment, which sponsors consistently say is the part that works.",
  },
  {
    q: "Can I sponsor a single event to try it?",
    a: "Yes. Community Partner and Featured Sponsor are priced per event. Most sponsors start with one, then move to a quarter once they've seen the room.",
  },
  {
    q: "Who is actually in the room?",
    a: "Personal injury attorneys, medical providers, case managers, paralegals, and industry vendors — mostly South Florida, with steady turnout from Palm Beach County. Attendance runs 60–130 depending on the format.",
  },
  {
    q: "How do I pay?",
    a: "Andrew invoices directly once you've agreed on the events and the tier. Nothing is charged through this app.",
  },
];

export default function SponsorPage() {
  const showcase = [...upcomingEvents.slice(0, 2), ...pastEvents.slice(0, 2)];

  return (
    <>
      <AppBar title="Sponsorship" />

      <main className="pb-tabbar">
        <div className="px-4 pt-4">
          <p className="mmg-eyebrow">Sponsorship opportunities</p>
          <h1 className="mt-1.5 font-serif text-[2rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
            An environment where professionals connect organically.
          </h1>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-muted text-pretty">
            Support the personal injury community while building recognition through event
            presence, promotional visibility, and meaningful conversations with attendees.
          </p>
        </div>

        <Section className="pt-6">
          <ul className="grid grid-cols-3 gap-2.5">
            {[
              { value: "60–130", label: "Attendees per event" },
              { value: "18+", label: "Events a year" },
              { value: "19", label: "Current partners" },
            ].map((stat) => (
              <li
                key={stat.label}
                className="rounded-2xl border border-[var(--line)] bg-paper px-2 py-3.5 text-center shadow-card"
              >
                <p className="mmg-display text-[1.5rem] text-red">{stat.value}</p>
                <p className="mt-1 text-[0.68rem] leading-tight font-semibold text-muted">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Choose your level" title="Three ways to be in the room." className="pt-1">
          <TierList tiers={sponsorTiers} />
          <p className="mt-3.5 text-center text-[0.75rem] leading-relaxed text-muted">
            Every tier is a conversation, not a checkout. Andrew follows up personally to make sure
            the fit is right before anything is invoiced.
          </p>
        </Section>

        <Section eyebrow="Where your brand shows up" title="Recent and upcoming rooms.">
          <div className="mmg-rail -mx-4 px-4">
            {showcase.map((event) => (
              <EventRailCard key={event.slug} event={event} />
            ))}
          </div>
        </Section>

        <Section eyebrow="They trust us" title="You'd be in good company.">
          <PartnerWall partners={partners} />
        </Section>

        <Section eyebrow="Questions" title="Before you ask Andrew.">
          <ul className="space-y-2.5">
            {FAQ.map((item) => (
              <li
                key={item.q}
                className="rounded-card border border-[var(--line)] bg-paper p-4 shadow-card"
              >
                <h3 className="text-[0.92rem] leading-snug font-semibold">{item.q}</h3>
                <p className="mt-1.5 text-[0.83rem] leading-relaxed text-muted text-pretty">
                  {item.a}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section className="pt-0 pb-4">
          <div className="rounded-card bg-espresso p-5 text-cream shadow-mmg">
            <p className="mmg-eyebrow text-gold">Rather just talk?</p>
            <h2 className="mt-2 font-serif text-[1.5rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance">
              Call Andrew directly.
            </h2>
            <p className="mt-2.5 text-[0.86rem] leading-relaxed text-cream/70 text-pretty">
              He&rsquo;ll tell you honestly which tier fits what you&rsquo;re trying to do — and
              which one doesn&rsquo;t.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button asChild variant="gold" size="lg">
                <a href={`tel:${site.phone.replace(/\D/g, "")}`}>
                  <Phone />
                  {site.phone}
                </a>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-cream hover:bg-cream/12">
                <a href={`mailto:${site.email}?subject=Sponsorship%20inquiry`}>
                  <Mail />
                  Email
                </a>
              </Button>
            </div>
          </div>
        </Section>
      </main>
    </>
  );
}
