"use client";

import { CalendarDays, Handshake, Home, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/discuss", label: "Discuss", icon: MessageSquare },
  { href: "/sponsor", label: "Sponsor", icon: Handshake },
  { href: "/contact", label: "Contact", icon: Phone },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="bg-paper/92 pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mmg-press relative flex h-[var(--tabbar-h)] flex-col items-center justify-center gap-1 text-[0.66rem] font-semibold tracking-[0.01em] transition-colors",
                  active ? "text-red" : "text-muted hover:text-espresso",
                )}
              >
                {active ? (
                  <span aria-hidden className="bg-red absolute top-0 h-[3px] w-9 rounded-b-full" />
                ) : null}
                <Icon className={cn("size-[1.3rem]", active && "stroke-[2.4]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
