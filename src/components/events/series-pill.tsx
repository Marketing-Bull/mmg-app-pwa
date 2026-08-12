import type { Series } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCENT: Record<Series["accent"], string> = {
  red: "bg-red/10 text-red",
  teal: "bg-teal/12 text-teal-dark",
  mango: "bg-mango/16 text-[#8f5c07]",
};

export function SeriesPill({ series, className }: { series: Series; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-[0.2rem] text-[0.65rem] font-bold tracking-[0.08em] uppercase",
        ACCENT[series.accent],
        className,
      )}
    >
      {series.name}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-sand-light text-muted inline-flex items-center rounded-full border border-[var(--line)] px-2.5 py-[0.25rem] text-[0.7rem] font-medium">
      {children}
    </span>
  );
}
