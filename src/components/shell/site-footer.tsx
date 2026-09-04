import { Instagram, Mail, MapPin, Phone, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/content";

const EXPLORE = [
  { href: "/events", label: "Upcoming events" },
  { href: "/events/past", label: "Past events" },
  { href: "/discuss", label: "Community" },
  { href: "/sponsor", label: "Sponsorship" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Full site footer.
 *
 * On phones the app shell owns navigation, so the three marketing columns would
 * just be a long scroll past links the tab bar already offers — they collapse
 * from `lg` down to nothing. The legal strip stays on every screen size,
 * because the disclaimer has to appear site-wide.
 */
export function SiteFooter() {
  return (
    <footer className="bg-espresso text-cream mt-8 lg:mt-14">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-16">
        <div className="hidden gap-10 lg:grid lg:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-cream/10 grid size-10 place-items-center rounded-xl">
                <Image
                  src="/assets/brand/mmg-official-logo.webp"
                  alt=""
                  width={32}
                  height={29}
                  className="h-[1.5rem] w-auto"
                />
              </span>
              <span className="font-serif text-[1.15rem] leading-tight font-semibold tracking-[-0.03em]">
                Miller&rsquo;s Marketing Group
              </span>
            </div>
            <p className="text-cream/70 mt-4 max-w-sm text-[0.88rem] leading-relaxed text-pretty">
              {site.tagline} {site.description}
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-gold text-[0.7rem] font-bold tracking-[0.14em] uppercase">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-cream/75 hover:text-cream text-[0.88rem] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-gold text-[0.7rem] font-bold tracking-[0.14em] uppercase">
              Get in touch
            </h2>
            <ul className="text-cream/75 mt-4 space-y-2.5 text-[0.88rem]">
              <li>
                <a
                  href={`tel:${site.phone.replace(/\D/g, "")}`}
                  className="hover:text-cream inline-flex items-center gap-2 transition-colors"
                >
                  <Phone className="text-gold size-4 shrink-0" />
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${site.phoneAlt.replace(/\D/g, "")}`}
                  className="hover:text-cream inline-flex items-center gap-2 transition-colors"
                >
                  <Phone className="text-gold size-4 shrink-0" />
                  {site.phoneAlt}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="hover:text-cream inline-flex items-center gap-2 break-all transition-colors"
                >
                  <Mail className="text-gold size-4 shrink-0" />
                  {site.email}
                </a>
              </li>
              <li className="inline-flex items-start gap-2">
                <MapPin className="text-gold mt-0.5 size-4 shrink-0" />
                {site.address}
              </li>
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="mmg-press bg-cream/10 hover:bg-cream/20 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-semibold transition-colors"
              >
                <Instagram className="size-3.5" />
                Instagram
              </a>
              <a
                href={site.eventbrite}
                target="_blank"
                rel="noreferrer"
                className="mmg-press bg-cream/10 hover:bg-cream/20 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-semibold transition-colors"
              >
                <Ticket className="size-3.5" />
                Eventbrite
              </a>
            </div>
          </div>
        </div>

        <div className="border-cream/15 lg:mt-10 lg:border-t lg:pt-6">
          <p className="text-cream/45 max-w-3xl text-[0.72rem] leading-relaxed text-pretty">
            {site.disclaimer}
          </p>
          <p className="text-cream/45 mt-3 text-[0.72rem]">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
