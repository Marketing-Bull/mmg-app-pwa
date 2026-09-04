import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { EventRailCard } from "@/components/events/event-card";
import { PartnerWall } from "@/components/shared/partner-wall";
import { PageIntro } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { TierList } from "@/components/sponsor/tier-list";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { Segmented } from "@/components/ui/segmented";
import { site, sponsorTiers } from "@/lib/content";
import { getEventFeed, getPartnerFeed } from "@/lib/feed";

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

export default async function SponsorPage() {
  const [{ upcoming, past }, { list: partners }] = await Promise.all([
    getEventFeed(),
    getPartnerFeed(),
  ]);
  const showcase = [...upcoming.slice(0, 2), ...past.slice(0, 2)];

  return (
    <>
      <AppBar title="Sponsorship" subtitle={`${sponsorTiers.length} tiers`} />

      <main className="pb-tabbar">
        <PageIntro eyebrow="Sponsorship" title="An environment where professionals connect.">
          Build recognition through event presence, promotional visibility, and real conversations
          with the people you want to work with.
        </PageIntro>

        {/* The numbers a sponsor asks for first, above everything else. */}
        <div className="mmg-shell pt-3">
          <ul className="grid grid-cols-3 gap-2">
            {[
              { value: "60–130", label: "Attendees per event" },
              { value: "18+", label: "Events a year" },
              { value: `${partners.length}`, label: "Current partners" },
            ].map((stat) => (
              <li
                key={stat.label}
                className="bg-paper shadow-card rounded-2xl border border-[var(--line)] px-2 py-3 text-center"
              >
                <p className="mmg-display text-red text-[1.4rem]">{stat.value}</p>
                <p className="text-muted mt-0.5 text-[0.66rem] leading-tight font-semibold">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <Segmented
          panelClassName="mmg-shell pt-3 pb-3"
          segments={[
            {
              value: "tiers",
              label: "Tiers",
              count: sponsorTiers.length,
              content: (
                <>
                  <TierList tiers={sponsorTiers} />
                  <p className="text-muted mt-3 text-center text-[0.74rem] leading-relaxed">
                    Every tier is a conversation, not a checkout. Andrew follows up personally to
                    make sure the fit is right before anything is invoiced.
                  </p>
                </>
              ),
            },
            {
              value: "proof",
              label: "The rooms",
              content: (
                <>
                  <h2 className="mmg-eyebrow mb-2">Where your brand shows up</h2>
                  <div className="mmg-rail -mx-4 px-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
                    {showcase.map((event) => (
                      <EventRailCard key={event.slug} event={event} />
                    ))}
                  </div>

                  <h2 className="mmg-eyebrow mt-5 mb-2">You&rsquo;d be in good company</h2>
                  <PartnerWall partners={partners} />
                </>
              ),
            },
            {
              value: "faq",
              label: "Questions",
              count: FAQ.length,
              content: (
                <ul className="grid gap-2 lg:grid-cols-2 lg:gap-4">
                  {FAQ.map((item) => (
                    <li key={item.q}>
                      <Disclosure summary={item.q}>
                        <p className="text-muted text-[0.83rem] leading-relaxed text-pretty">
                          {item.a}
                        </p>
                      </Disclosure>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />

        <div className="mmg-shell pb-4">
          <div className="rounded-card bg-espresso text-cream shadow-mmg p-4 lg:p-8">
            <p className="mmg-eyebrow text-gold">Rather just talk?</p>
            <h2 className="mt-1.5 font-serif text-[1.35rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance lg:text-[2rem]">
              Call Andrew directly.
            </h2>
            <p className="text-cream/70 mt-2 text-[0.84rem] leading-snug text-pretty lg:text-[1rem]">
              He&rsquo;ll tell you honestly which tier fits what you&rsquo;re trying to do — and
              which one doesn&rsquo;t.
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <Button asChild variant="gold">
                <a href={`tel:${site.phone.replace(/\D/g, "")}`}>
                  <Phone />
                  {site.phone}
                </a>
              </Button>
              <Button asChild variant="ghost" className="text-cream hover:bg-cream/12">
                <a href={`mailto:${site.email}?subject=Sponsorship%20inquiry`}>
                  <Mail />
                  Email
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
