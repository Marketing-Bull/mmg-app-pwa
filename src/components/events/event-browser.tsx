"use client";

import { useMemo, useState } from "react";
import { List } from "@/components/ui/list";
import type { EventRow as EventRowData } from "@/lib/rows";
import { EventRow } from "./event-row";

export interface SeriesFilter {
  id: string;
  label: string;
}

/**
 * A filtered list of events. The chips narrow the list in place — no page load,
 * no scrolling past series you don't care about.
 */
export function EventBrowser({
  events,
  filters,
  emptyLabel = "Nothing here yet.",
}: {
  events: EventRowData[];
  filters: SeriesFilter[];
  emptyLabel?: string;
}) {
  const [active, setActive] = useState("all");

  const shown = useMemo(
    () => (active === "all" ? events : events.filter((event) => event.seriesId === active)),
    [active, events],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      const key = event.seriesId ?? "other";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  return (
    <div>
      {filters.length > 1 ? (
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
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="mmg-chip mmg-press"
              aria-pressed={active === filter.id}
              onClick={() => setActive(filter.id)}
            >
              {filter.label}
              <span className="opacity-60">{counts.get(filter.id) ?? 0}</span>
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
