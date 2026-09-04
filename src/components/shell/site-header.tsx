"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button-variants";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/events/past", label: "Past events" },
  { href: "/discuss", label: "Discuss" },
  { href: "/sponsor", label: "Sponsorship" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Desktop site navigation. Phones get the app shell instead (AppBar + TabBar),
 * so this only appears from `lg` up.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-cream/90 sticky top-0 z-40 hidden border-b border-[var(--line)] backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center gap-8 px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="bg-espresso grid size-10 place-items-center rounded-xl">
            <Image
              src="/assets/brand/mmg-official-logo.webp"
              alt=""
              width={32}
              height={29}
              className="h-[1.5rem] w-auto"
            />
          </span>
          <span className="text-[0.95rem] leading-tight font-semibold tracking-[-0.02em]">
            Miller&rsquo;s
            <br />
            Marketing Group
          </span>
        </Link>

        <nav aria-label="Primary" className="flex flex-1 items-center justify-center gap-1">
          {LINKS.map(({ href, label }) => {
            // /events must not light up while you're on /events/past.
            const active = href === "/events" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-[0.85rem] font-semibold transition-colors",
                  active ? "text-red" : "text-muted hover:bg-sand-light hover:text-espresso",
                )}
              >
                {label}
                {active ? (
                  <span
                    aria-hidden
                    className="bg-red absolute inset-x-3.5 -bottom-[1.15rem] h-[2px] rounded-full"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`tel:${site.phone.replace(/\D/g, "")}`}
            className="text-muted hover:text-espresso text-[0.85rem] font-semibold transition-colors"
          >
            {site.phone}
          </a>
          <Link href="/contact" className={buttonVariants({ variant: "espresso", size: "sm" })}>
            Talk with Andrew
          </Link>
        </div>
      </div>
    </header>
  );
}
