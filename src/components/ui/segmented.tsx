"use client";

import * as Tabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Segment {
  value: string;
  label: string;
  /** Optional badge — a count reads as "there is something here". */
  count?: number;
  content: ReactNode;
}

/**
 * The in-page tab switcher that replaces a long stacked scroll.
 *
 * Every panel is force-mounted and hidden with the `hidden` attribute rather
 * than unmounted, so all of the page's content still lands in the server-
 * rendered HTML — findable, indexable, and printable — while only one panel
 * occupies the screen at a time.
 */
export function Segmented({
  segments,
  defaultValue,
  /** Pins the control under the AppBar so switching never means scrolling up. */
  sticky = true,
  className,
  listClassName = "mmg-shell",
  panelClassName,
}: {
  segments: Segment[];
  defaultValue?: string;
  sticky?: boolean;
  className?: string;
  /** Wrapper around the control itself — defaults to the page gutter. */
  listClassName?: string;
  panelClassName?: string;
}) {
  if (segments.length === 0) return null;

  return (
    <Tabs.Root defaultValue={defaultValue ?? segments[0].value} className={className}>
      <div
        className={cn(
          "py-2",
          listClassName,
          sticky && "top-appbar bg-cream/92 sticky z-20 backdrop-blur-xl",
        )}
      >
        <Tabs.List className="mmg-seg" aria-label="Section">
          {segments.map((segment) => (
            <Tabs.Trigger key={segment.value} value={segment.value} className="mmg-seg-item">
              {segment.label}
              {typeof segment.count === "number" ? (
                <span className="mmg-seg-count">{segment.count}</span>
              ) : null}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </div>

      {segments.map((segment) => (
        <Tabs.Content
          key={segment.value}
          value={segment.value}
          forceMount
          className={cn(
            // forceMount keeps the panel in the HTML; this keeps it off the
            // screen until it is the one you picked.
            "outline-none data-[state=inactive]:hidden",
            "data-[state=active]:animate-[mmg-fade-up_0.22s_var(--ease-out-soft)]",
            panelClassName,
          )}
        >
          {segment.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
