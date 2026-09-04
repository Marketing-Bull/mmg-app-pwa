import { ArrowRight, CalendarDays, Handshake, MessageSquare, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FeaturedEventCard } from "@/components/events/event-card";
import { EventRow } from "@/components/events/event-row";
import { SeriesPill } from "@/components/events/series-pill";
import { HostCard } from "@/components/shared/host-card";
import { PartnerWall } from "@/components/shared/partner-wall";
import { Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { List } from "@/components/ui/list";
import { Segmented } from "@/components/ui/segmented";
import {
  featuredEvent,
  getHost,
  getSeries,
  hosts,
  partners,
  pastEvents,
  seriesList,
  site,
  upcomingEvents,
} from "@/lib/content";
import { formatShortDate } from "@/lib/format";
import { toEventRow } from "@/lib/rows";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/events", icon: CalendarDays, label: "Events" },
  { href: "/discuss", icon: MessageSquare, label: "Discuss" },
  { href: "/sponsor", icon: Handshake, label: "Sponsor" },
  { href: "/contact", icon: Phone, label: "Contact" },
] as const;

export default function HomePage() {
  const host = getHost("andrew-miller") ?? hosts[0];
  const nextUp = upcomingEvents
    .slice(1, 6)
    .map((event) => toEventRow(event, getSeries(event.seriesId)));
  const recaps = pastEvents
    .slice(0, 5)
    .map((event) => toEventRow(event, getSeries(event.seriesId)));

  return (
    <>
      <AppBar
        action={
          <Button asChild size="sm" variant="espresso">
            <Link href="/contact">Talk with Andrew</Link>
          </Button>
        }
      />

      <main className="pb-tabbar">
        {/*
          Hero. Deliberately short on phones — the app's job is to get you to the
          next event, not to sell you down a page of marketing.
        */}
        <section className="mmg-shell relative pt-3 pb-1 lg:pt-8 lg:pb-4">
          <div className="rounded-card bg-espresso text-cream shadow-mmg relative overflow-hidden">
            <Image
              src="/assets/brand/networking-hero.webp"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 72rem, (min-width: 640px) 42rem, 100vw"
              className="object-cover opacity-30"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(165deg,rgba(38,29,25,0.72),rgba(38,29,25,0.94))] lg:bg-[linear-gradient(100deg,rgba(38,29,25,0.95)_38%,rgba(38,29,25,0.55)_100%)]"
            />
            <div className="relative px-4 py-5 lg:max-w-3xl lg:px-14 lg:py-24">
              <p className="bg-cream/12 text-gold inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[0.62rem] font-bold tracking-[0.12em] uppercase">
                Florida&rsquo;s PI community
              </p>
              <h1 className="mt-2.5 font-serif text-[1.95rem] leading-[0.96] font-semibold tracking-[-0.045em] text-balance lg:mt-6 lg:text-[4.6rem]">
                The right room
                <br />
                <span className="text-gold">changes everything.</span>
              </h1>
              <p className="text-cream/75 mt-2 max-w-[26rem] text-[0.83rem] leading-snug text-pretty lg:mt-6 lg:max-w-[34rem] lg:text-[1.15rem] lg:leading-relaxed">
                Attorneys, medical providers, and trusted partners, together at curated events
                across Florida.
              </p>
              {/*
                Styled with buttonVariants rather than <Button asChild> — these
                links sit inside a server component and don't need a client
                boundary just to carry button styling.
              */}
              <div className="mt-4 flex flex-wrap gap-2 lg:mt-9">
                <Link href="/events" className={buttonVariants({ variant: "gold" })}>
                  Find your next event
                  <ArrowRight />
                </Link>
                <Link
                  href="/events/past"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "text-cream border-cream/25 hover:bg-cream/12 border",
                  )}
                >
                  See past recaps
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Everything the app does, one tap from the top of the screen. */}
        <nav aria-label="Shortcuts" className="mmg-shell pt-3 lg:hidden">
          <ul className="grid grid-cols-4 gap-2 lg:gap-4">
            {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="mmg-press bg-paper shadow-card flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--line)] px-1 py-3"
                >
                  <Icon className="text-red size-[1.15rem]" />
                  <span className="text-[0.72rem] font-semibold">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* The single most useful thing on the screen. */}
        {featuredEvent ? (
          <Section
            eyebrow="Next up"
            action={{ href: "/events", label: "All events" }}
            className="py-4 lg:py-10"
          >
            <FeaturedEventCard event={featuredEvent} priority split />
          </Section>
        ) : null}

        {/*
          Three former page-length sections, stacked into one switcher. Every
          panel ships in the HTML; only one takes up the screen.
        */}
        <Segmented
          sticky={false}
          panelClassName="mmg-shell pt-1 pb-2"
          segments={[
            {
              value: "upcoming",
              label: "Upcoming",
              count: nextUp.length,
              content: (
                <>
                  <List>
                    {nextUp.map((event) => (
                      <EventRow key={event.slug} event={event} />
                    ))}
                  </List>
                  <Link
                    href="/events"
                    className="text-red mt-3 block text-center text-[0.8rem] font-semibold"
                  >
                    See the full calendar
                  </Link>
                </>
              ),
            },
            {
              value: "recaps",
              label: "Recaps",
              count: recaps.length,
              content: (
                <>
                  <List>
                    {recaps.map((event) => (
                      <EventRow key={event.slug} event={event} />
                    ))}
                  </List>
                  <Link
                    href="/events/past"
                    className="text-red mt-3 block text-center text-[0.8rem] font-semibold"
                  >
                    Open the archive
                  </Link>
                </>
              ),
            },
            {
              value: "series",
              label: "Series",
              content: (
                <ul className="grid gap-2 lg:grid-cols-3 lg:gap-4">
                  {seriesList.map((series) => (
                    <li
                      key={series.id}
                      className="rounded-card bg-paper shadow-card border border-[var(--line)] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <SeriesPill series={series} />
                        <span className="text-muted text-[0.7rem] font-semibold">
                          {series.cadence}
                        </span>
                      </div>
                      <p className="text-muted mt-2 text-[0.82rem] leading-snug text-pretty">
                        {series.description}
                      </p>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />

        {/* Why people come — a rail, so three cards cost one card of height. */}
        <Section eyebrow="Why people come" className="py-4 lg:py-10">
          <ul className="mmg-rail -mx-4 px-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0">
            {site.valueProps.map((prop) => (
              <li
                key={prop.title}
                className="rounded-card bg-paper shadow-card w-[16rem] border border-[var(--line)] p-3.5 lg:w-auto"
              >
                <h3 className="font-serif text-[1.05rem] leading-tight font-semibold tracking-[-0.03em]">
                  {prop.title}
                </h3>
                <p className="text-muted mt-1.5 text-[0.82rem] leading-snug text-pretty">
                  {prop.body}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Host — the compact row on phones, the full card from lg up. */}
        <Section
          eyebrow="Meet Andrew Miller"
          title="A connector by nature."
          className="py-4 lg:py-10"
        >
          <div className="lg:hidden">
            <HostCard host={host} compact />
          </div>
          <div className="hidden lg:block">
            <HostCard host={host} />
          </div>
        </Section>

        {/* Partners — a rail on phones, the wall on desktop. */}
        <Section
          eyebrow="They trust us"
          action={{ href: "/sponsor", label: "Sponsor" }}
          className="py-4 lg:py-10"
        >
          <div className="lg:hidden">
            <ul className="mmg-rail -mx-4 px-4">
              {partners.slice(0, 12).map((partner) => (
                <li key={partner.id} className="w-[8.5rem]">
                  <div className="bg-paper grid h-[4.25rem] place-items-center rounded-2xl border border-[var(--line)] px-3">
                    {partner.logo ? (
                      <Image
                        src={partner.logo.src}
                        alt={partner.logo.alt}
                        width={150}
                        height={57}
                        sizes="136px"
                        className="max-h-10 w-auto object-contain"
                      />
                    ) : (
                      <span className="text-espresso/75 text-center text-[0.66rem] leading-tight font-bold uppercase">
                        {partner.name}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden lg:block">
            <PartnerWall partners={partners.slice(0, 12)} />
          </div>
        </Section>

        {/* Closing CTA */}
        <Section className="pt-2 pb-4 lg:py-10">
          <div className="rounded-card bg-espresso text-cream shadow-mmg p-4 lg:p-8">
            <p className="mmg-eyebrow text-gold">Start with a conversation</p>
            <h2 className="mt-1.5 font-serif text-[1.4rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance lg:text-[2rem]">
              Who do you want to meet?
            </h2>
            <p className="text-cream/70 mt-2 text-[0.84rem] leading-snug text-pretty lg:text-[1rem]">
              Tell Andrew about your practice and the relationships you want to build. He&rsquo;ll
              recommend the right room.
            </p>
            <Button asChild variant="gold" block className="mt-3.5 lg:w-auto">
              <Link href="/contact">
                Send a message
                <ArrowRight />
              </Link>
            </Button>
            {featuredEvent ? (
              <p className="text-cream/55 mt-2.5 text-center text-[0.73rem] lg:text-left">
                Or just come to {formatShortDate(featuredEvent.date)} in {featuredEvent.venue.city}.
              </p>
            ) : null}
          </div>
        </Section>
      </main>
    </>
  );
}
