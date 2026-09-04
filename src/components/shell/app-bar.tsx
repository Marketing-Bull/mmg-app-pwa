"use client";

import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AppBar({
  title,
  subtitle,
  back,
  action,
  transparent,
}: {
  title?: string;
  /** Small second line — where a native bar puts date, venue, or count. */
  subtitle?: string;
  /** Href to fall back to when there's no history (deep link / fresh install). */
  back?: string;
  action?: ReactNode;
  transparent?: boolean;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "pt-safe sticky top-0 z-30 transition-colors lg:hidden",
        transparent
          ? "bg-transparent"
          : "bg-cream/90 border-b border-[var(--line)] backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-[var(--appbar-h)] max-w-2xl items-center gap-2 px-2.5">
        {back ? (
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push(back);
            }}
            aria-label="Go back"
            className={cn(
              "mmg-press grid size-9 shrink-0 place-items-center rounded-full",
              transparent
                ? "bg-espresso/55 text-cream backdrop-blur-md"
                : "bg-sand-light text-espresso hover:bg-sand",
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <Link href="/" className="mmg-press flex shrink-0 items-center gap-2 pl-0.5">
            <span className="bg-espresso grid size-9 place-items-center rounded-xl">
              <Image
                src="/assets/brand/mmg-official-logo.webp"
                alt=""
                width={28}
                height={26}
                className="h-[1.35rem] w-auto"
              />
            </span>
            <span className="sr-only">Miller&rsquo;s Marketing Group home</span>
          </Link>
        )}

        {title ? (
          <div className={cn("min-w-0 flex-1 text-center", transparent && "sr-only")}>
            <h1 className="truncate font-sans text-[0.92rem] leading-tight font-semibold tracking-[-0.015em]">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-muted truncate text-[0.68rem] leading-tight">{subtitle}</p>
            ) : null}
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[0.92rem] font-semibold tracking-[-0.02em]">
            Miller&rsquo;s Marketing Group
          </span>
        )}

        <div className="flex shrink-0 items-center gap-1.5">{action}</div>
      </div>
    </header>
  );
}
