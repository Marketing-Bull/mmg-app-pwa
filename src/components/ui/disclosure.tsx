import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Native `<details>` disclosure. Long-form supporting content stays on the page
 * — and in the HTML — without paying for it in scroll height.
 */
export function Disclosure({
  summary,
  sub,
  children,
  defaultOpen,
  className,
}: {
  summary: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "rounded-card bg-paper shadow-card group border border-[var(--line)]",
        className,
      )}
    >
      <summary className="mmg-press flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9rem] leading-snug font-semibold">{summary}</span>
          {sub ? <span className="text-muted mt-0.5 block text-[0.76rem]">{sub}</span> : null}
        </span>
        <ChevronDown className="text-muted size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-[var(--line)] p-4">{children}</div>
    </details>
  );
}
