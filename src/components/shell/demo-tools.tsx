"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";

/**
 * Reset control for stakeholder walkthroughs — clears RSVPs, comments, saved
 * events and inquiries so the next person starts from the seeded state.
 */
export function DemoTools() {
  const { rsvps, comments, saved, inquiries, resetDemo, hydrated } = useStore();
  const { toast } = useToast();

  const commentCount = Object.values(comments).reduce((sum, list) => sum + list.length, 0);
  const stats = [
    { label: "RSVPs", value: Object.keys(rsvps).length },
    { label: "Comments", value: commentCount },
    { label: "Saved", value: saved.length },
    { label: "Inquiries", value: inquiries.length },
  ];
  const total = stats.reduce((sum, stat) => sum + stat.value, 0);

  return (
    <div className="rounded-card bg-paper shadow-card border border-[var(--line)] p-4">
      <p className="text-muted text-[0.85rem] leading-relaxed text-pretty">
        Everything you do in this app — RSVPs, comments, saved events — is stored on this device
        only. Nothing is shared with other visitors.
      </p>

      <ul className="mt-3.5 grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <li key={stat.label} className="bg-cream rounded-xl px-1 py-2.5 text-center">
            <p className="mmg-display text-espresso text-[1.3rem] tabular-nums">
              {hydrated ? stat.value : 0}
            </p>
            <p className="text-muted text-[0.62rem] leading-tight font-semibold">{stat.label}</p>
          </li>
        ))}
      </ul>

      <Button
        variant="outline"
        block
        className="mt-3.5"
        disabled={!hydrated || total === 0}
        onClick={() => {
          resetDemo();
          toast({
            tone: "info",
            title: "Demo reset",
            body: "Back to the starting state for the next walkthrough.",
          });
        }}
      >
        <RotateCcw />
        Reset my activity
      </Button>
    </div>
  );
}
