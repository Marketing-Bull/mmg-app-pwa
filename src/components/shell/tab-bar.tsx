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
      className="bg-paper/94 pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] backdrop-blur-xl lg:hidden"
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
                  "mmg-press flex h-[var(--tabbar-h)] flex-col items-center justify-center gap-[0.15rem] text-[0.63rem] font-semibold tracking-[0.01em] transition-colors",
                  active ? "text-red" : "text-muted hover:text-espresso",
                )}
              >
                {/* The pill behind the active icon is the whole indicator — no
                    hairline on top of the bar, the way a native tab bar reads. */}
                <span
                  className={cn(
                    "grid h-[1.85rem] w-[3.25rem] place-items-center rounded-full transition-colors",
                    active && "bg-red/10",
                  )}
                >
                  <Icon className={cn("size-[1.28rem]", active && "stroke-[2.4]")} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
