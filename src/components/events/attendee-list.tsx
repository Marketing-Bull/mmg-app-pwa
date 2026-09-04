"use client";

import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { roles } from "@/lib/site";
import { useStore } from "@/lib/store";
import type { Attendee, MMGEvent, RoleId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<RoleId, string> = {
  attorney: "bg-red/10 text-red",
  provider: "bg-teal/12 text-teal-dark",
  sponsor: "bg-mango/18 text-[#8f5c07]",
};

const INITIAL_SHOWN = 8;

export function AttendeeList({ event }: { event: MMGEvent }) {
  const { rsvps, hydrated } = useStore();
  const [expanded, setExpanded] = useState(false);

  const rsvp = hydrated ? rsvps[event.slug] : undefined;

  // Your RSVP goes to the top of the list, exactly where you'd look for it.
  const attendees = useMemo<Attendee[]>(() => {
    if (!rsvp) return event.attendees;
    return [
      { name: rsvp.name, role: rsvp.role, company: rsvp.company, isYou: true },
      ...event.attendees,
    ];
  }, [event.attendees, rsvp]);

  const guests = rsvp?.guests ?? 0;
  const total = event.attendingCount + (rsvp ? 1 + guests : 0);
  const shown = expanded ? attendees : attendees.slice(0, INITIAL_SHOWN);
  // Named attendees we can still reveal by expanding.
  const collapsed = attendees.length - shown.length;
  // Everyone else who RSVP'd but isn't listed by name.
  const unlisted = Math.max(0, total - attendees.length);

  return (
    <section aria-label="Who's coming">
      <header className="mb-3.5 flex items-center gap-2">
        <Users className="text-red size-4" />
        <h2 className="font-serif text-[1.15rem] font-semibold tracking-[-0.03em]">
          Who&rsquo;s coming
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold transition-colors",
            rsvp ? "bg-teal text-cream" : "bg-sand-light text-muted",
          )}
        >
          {total}
        </span>
      </header>

      <ul className="grid gap-2">
        {shown.map((attendee, index) => (
          <li
            key={`${attendee.name}-${index}`}
            className={cn(
              "bg-paper flex items-center gap-3 rounded-2xl border border-[var(--line)] px-3.5 py-2.5",
              attendee.isYou &&
                "border-teal/40 bg-teal/[0.06] animate-[mmg-fade-up_0.35s_var(--ease-out-soft)]",
            )}
          >
            <Avatar name={attendee.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[0.86rem] font-semibold">{attendee.name}</span>
                {attendee.isYou ? (
                  <span className="bg-teal text-cream rounded-full px-1.5 py-[0.1rem] text-[0.62rem] font-bold tracking-[0.05em] uppercase">
                    You
                  </span>
                ) : null}
              </div>
              <p className="text-muted truncate text-[0.75rem]">{attendee.company}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-[0.15rem] text-[0.65rem] font-bold tracking-[0.04em] uppercase",
                ROLE_BADGE[attendee.role],
              )}
            >
              {roles.find((r) => r.id === attendee.role)?.label ?? attendee.role}
            </span>
          </li>
        ))}
      </ul>

      {guests > 0 ? (
        <p className="text-muted mt-2 text-[0.75rem]">
          Plus {guests} {guests === 1 ? "guest" : "guests"} from your team.
        </p>
      ) : null}

      {collapsed > 0 || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mmg-press bg-sand-light text-espresso mt-2.5 w-full rounded-2xl border border-[var(--line)] px-4 py-2.5 text-[0.8rem] font-semibold"
        >
          {expanded
            ? "Show fewer"
            : `Show ${collapsed} more ${collapsed === 1 ? "attendee" : "attendees"}`}
        </button>
      ) : null}

      {unlisted > 0 ? (
        <p className="text-muted mt-2.5 text-center text-[0.75rem]">
          + {unlisted} more attending who chose not to be listed publicly.
        </p>
      ) : null}
    </section>
  );
}
