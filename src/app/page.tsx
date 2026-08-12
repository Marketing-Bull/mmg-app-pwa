import { ArrowRight, CalendarDays, Handshake, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EventRailCard, FeaturedEventCard } from "@/components/events/event-card";
import { SeriesPill } from "@/components/events/series-pill";
import { HostCard } from "@/components/shared/host-card";
import { PartnerWall } from "@/components/shared/partner-wall";
import { Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  featuredEvent,
  getHost,
  hosts,
  partners,
  pastEvents,
  seriesList,
  site,
  upcomingEvents,
} from "@/lib/content";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const host = getHost("andrew-miller") ?? hosts[0];
  const nextUp = upcomingEvents.slice(1, 5);
  const recaps = pastEvents.slice(0, 4);

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
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-4 pb-2">
          <div className="rounded-card bg-espresso text-cream shadow-mmg relative overflow-hidden">
            <Image
              src="/assets/brand/networking-hero.webp"
              alt=""
              fill
              priority
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover opacity-30"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(165deg,rgba(38,29,25,0.72),rgba(38,29,25,0.94))]"
            />
            <div className="relative px-5 py-8">
              <p className="bg-cream/12 text-gold inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem] font-bold tracking-[0.12em] uppercase">
                Florida&rsquo;s PI community
              </p>
              <h1 className="mt-4 font-serif text-[2.6rem] leading-[0.94] font-semibold tracking-[-0.05em] text-balance">
                The right room
                <br />
                <span className="text-gold">changes everything.</span>
              </h1>
              <p className="text-cream/75 mt-3.5 max-w-[26rem] text-[0.9rem] leading-relaxed text-pretty">
                MMG brings personal injury attorneys, medical providers, and trusted industry
                partners together through curated events across Florida.
              </p>
              {/*
                Styled with buttonVariants rather than <Button asChild> — these
                links sit inside a server component and don't need a client
                boundary just to carry button styling.
              */}
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link href="/events" className={buttonVariants({ variant: "gold", size: "lg" })}>
                  Find your next event
                  <ArrowRight />
                </Link>
                <Link
                  href="/events/past"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "text-cream hover:bg-cream/12",
                  )}
                >
                  See past recaps
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured event */}
        {featuredEvent ? (
          <Section
            eyebrow="Next up"
            title="Come meet the personal injury community."
            action={{ href: "/events", label: "All events" }}
          >
            <FeaturedEventCard event={featuredEvent} priority />
          </Section>
        ) : null}

        {/* Value props */}
        <Section className="pt-0">
          <ul className="grid gap-2.5">
            {site.valueProps.map((prop) => (
              <li
                key={prop.title}
                className="rounded-card bg-paper shadow-card border border-[var(--line)] p-4"
              >
                <h3 className="font-serif text-[1.1rem] leading-tight font-semibold tracking-[-0.03em]">
                  {prop.title}
                </h3>
                <p className="text-muted mt-1.5 text-[0.84rem] leading-relaxed text-pretty">
                  {prop.body}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Upcoming rail */}
        {nextUp.length > 0 ? (
          <Section
            eyebrow="On the calendar"
            title="Also coming up"
            action={{ href: "/events", label: "See all" }}
          >
            <div className="mmg-rail -mx-4 px-4">
              {nextUp.map((event) => (
                <EventRailCard key={event.slug} event={event} />
              ))}
            </div>
          </Section>
        ) : null}

        {/* Series */}
        <Section eyebrow="How it works" title="Two series, every month.">
          <ul className="grid gap-2.5">
            {seriesList.map((series) => (
              <li
                key={series.id}
                className="rounded-card bg-paper shadow-card border border-[var(--line)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <SeriesPill series={series} />
                  <span className="text-muted text-[0.72rem] font-semibold">{series.cadence}</span>
                </div>
                <p className="text-muted mt-2.5 text-[0.84rem] leading-relaxed text-pretty">
                  {series.description}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Past recaps */}
        {recaps.length > 0 ? (
          <Section
            eyebrow="Past events"
            title="The recap shows the connection."
            action={{ href: "/events/past", label: "Archive" }}
          >
            <div className="mmg-rail -mx-4 px-4">
              {recaps.map((event) => (
                <EventRailCard key={event.slug} event={event} />
              ))}
            </div>
          </Section>
        ) : null}

        {/* Quick links */}
        <Section className="pt-0">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                href: "/events",
                icon: CalendarDays,
                label: "Events",
                sub: `${upcomingEvents.length} upcoming`,
              },
              { href: "/discuss", icon: MessageSquare, label: "Discuss", sub: "Community" },
              { href: "/sponsor", icon: Handshake, label: "Sponsor", sub: "3 tiers" },
            ].map(({ href, icon: Icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                className="mmg-press rounded-card bg-paper shadow-card flex flex-col items-center gap-1.5 border border-[var(--line)] px-2 py-4 text-center"
              >
                <Icon className="text-red size-5" />
                <span className="text-[0.82rem] font-semibold">{label}</span>
                <span className="text-muted text-[0.68rem]">{sub}</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* Host */}
        <Section eyebrow="Meet Andrew Miller" title="A connector by nature.">
          <HostCard host={host} />
        </Section>

        {/* Partners */}
        <Section
          eyebrow="They trust us"
          title="Partners who help ideas move."
          action={{ href: "/sponsor", label: "Sponsor" }}
        >
          <PartnerWall partners={partners.slice(0, 12)} />
          <p className="text-muted mt-3 text-center text-[0.75rem]">
            Current clients and sponsors featured by MMG.
          </p>
        </Section>

        {/* Closing CTA */}
        <Section className="pb-4">
          <div className="rounded-card bg-espresso text-cream shadow-mmg p-5">
            <p className="mmg-eyebrow text-gold">Start with a conversation</p>
            <h2 className="mt-2 font-serif text-[1.6rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance">
              Who do you want to meet?
            </h2>
            <p className="text-cream/70 mt-2.5 text-[0.86rem] leading-relaxed text-pretty">
              Tell Andrew about your practice and the relationships you want to build. He&rsquo;ll
              recommend the right room.
            </p>
            <Button asChild size="lg" variant="gold" block className="mt-4">
              <Link href="/contact">
                Send a message
                <ArrowRight />
              </Link>
            </Button>
            {featuredEvent ? (
              <p className="text-cream/55 mt-3 text-center text-[0.75rem]">
                Or just come to {formatShortDate(featuredEvent.date)} in {featuredEvent.venue.city}.
              </p>
            ) : null}
          </div>
        </Section>

        <footer className="px-4 pb-6 text-center">
          <p className="text-muted/80 text-[0.7rem] leading-relaxed text-pretty">
            {site.disclaimer}
          </p>
          <p className="text-muted/70 mt-2 text-[0.7rem]">
            © {new Date().getFullYear()} {site.name}
          </p>
        </footer>
      </main>
    </>
  );
}
