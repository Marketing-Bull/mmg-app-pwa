"use client";

import { Bookmark, CalendarPlus, Check, Share2, Ticket } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { downloadIcs } from "@/lib/calendar";
import { site } from "@/lib/content";
import { formatFullDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { MMGEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RsvpDialog } from "./rsvp-dialog";

export function EventActions({ event, isPast }: { event: MMGEvent; isPast: boolean }) {
  const { hasRsvp, cancelRsvp, isSaved, toggleSaved, hydrated } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const going = hydrated && hasRsvp(event.slug);
  const saved = hydrated && isSaved(event.slug);

  const addToCalendar = () => {
    downloadIcs(event, site.email);
    toast({
      tone: "calendar",
      title: "Calendar invite downloaded",
      body: `${event.title} — ${formatFullDate(event.date)}`,
    });
  };

  const share = async () => {
    const url = `${window.location.origin}/events/${event.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: event.summary, url });
        return;
      } catch {
        // Share sheet dismissed — fall back to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ tone: "success", title: "Link copied", body: "Paste it wherever you like." });
    } catch {
      toast({ tone: "warning", title: "Couldn't copy the link", body: url });
    }
  };

  return (
    <>
      <div className="space-y-2.5">
        {isPast ? (
          <Button variant="outline" size="lg" block onClick={share}>
            <Share2 />
            Share this recap
          </Button>
        ) : going ? (
          <div className="rounded-card border-teal/35 bg-teal/[0.07] border p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="bg-teal text-cream grid size-9 shrink-0 place-items-center rounded-full">
                <Check className="size-5 stroke-[3]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-teal-dark text-[0.9rem] font-semibold">You&rsquo;re going</p>
                <p className="text-muted text-[0.75rem]">
                  Your spot is held. Name tags are at the door.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" block onClick={addToCalendar}>
                <CalendarPlus />
                Calendar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                block
                onClick={() => {
                  cancelRsvp(event.slug);
                  toast({
                    tone: "info",
                    title: "RSVP cancelled",
                    body: "You can come back any time.",
                  });
                }}
              >
                Cancel RSVP
              </Button>
            </div>
          </div>
        ) : (
          <Button size="lg" block onClick={() => setOpen(true)}>
            <Ticket />
            RSVP — takes 30 seconds
          </Button>
        )}

        <div className="flex gap-2.5">
          {!isPast && !going ? (
            <Button variant="outline" block onClick={addToCalendar}>
              <CalendarPlus />
              Add to calendar
            </Button>
          ) : null}
          <Button
            variant="outline"
            block={isPast || going}
            onClick={() => {
              toggleSaved(event.slug);
              toast({
                tone: saved ? "info" : "success",
                title: saved ? "Removed from saved" : "Saved",
                body: saved ? undefined : "Find it again from the Events tab.",
              });
            }}
            aria-pressed={saved}
            className={cn(saved && "border-red/40 text-red")}
          >
            <Bookmark className={cn(saved && "fill-current")} />
            {saved ? "Saved" : "Save"}
          </Button>
          {!isPast ? (
            <Button variant="outline" size="icon" onClick={share} aria-label="Share this event">
              <Share2 />
            </Button>
          ) : null}
        </div>
      </div>

      <RsvpDialog event={event} open={open} onOpenChange={setOpen} />
    </>
  );
}
