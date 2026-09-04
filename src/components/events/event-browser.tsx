"use client";

import { useMemo, useState } from "react";
import { List } from "@/components/ui/list";
import type { EventRow as EventRowData } from "@/lib/rows";
import { EventRow } from "./event-row";

/**
 * A filtered list of events. The chips narrow the list in place — no page load,
 * no scrolling past the kind of event you don't care about — and are derived
 * from the rows themselves, so they disappear when there is nothing to sort by.
 */
export function EventBrowser({
  events,
  emptyLabel = "Nothing here yet.",
}: {
  events: EventRowData[];
  emptyLabel?: string;
}) {
  const [active, setActive] = useState("all");

  const kinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      if (!event.kind) continue;
      counts.set(event.kind, (counts.get(event.kind) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [events]);

  const shown = active === "all" ? events : events.filter((event) => event.kind === active);

  return (
    <div>
      {kinds.length > 1 ? (
        <div className="mmg-scroller -mx-4 mb-3 px-4 pb-0.5 lg:mx-0 lg:px-0">
          <button
            type="button"
            className="mmg-chip mmg-press"
            aria-pressed={active === "all"}
            onClick={() => setActive("all")}
          >
            All
            <span className="opacity-60">{events.length}</span>
          </button>
          {kinds.map(([kind, count]) => (
            <button
              key={kind}
              type="button"
              className="mmg-chip mmg-press"
              aria-pressed={active === kind}
              onClick={() => setActive(kind)}
            >
              {kind}
              <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {shown.length ? (
        <List>
          {shown.map((event) => (
            <EventRow key={event.slug} event={event} />
          ))}
        </List>
      ) : (
        <p className="rounded-card bg-sand-light text-muted border border-[var(--line)] p-4 text-center text-[0.85rem]">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}
