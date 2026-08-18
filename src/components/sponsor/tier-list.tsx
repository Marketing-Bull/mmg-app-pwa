"use client";

import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { SponsorTier } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TierInquiryDialog } from "./tier-inquiry-dialog";

const ACCENT: Record<
  SponsorTier["accent"],
  { border: string; chip: string; price: string; button: "outline" | "primary" | "gold" }
> = {
  sand: {
    border: "border-[var(--line)]",
    chip: "bg-sand text-espresso",
    price: "text-espresso",
    button: "outline",
  },
  gold: {
    border: "border-gold",
    chip: "bg-gold text-espresso",
    price: "text-[#8f5c07]",
    button: "gold",
  },
  red: {
    border: "border-red/45",
    chip: "bg-red text-cream",
    price: "text-red",
    button: "primary",
  },
};

export function TierList({ tiers }: { tiers: SponsorTier[] }) {
  const { inquiries, hydrated } = useStore();
  const [active, setActive] = useState<SponsorTier | null>(null);
  const [open, setOpen] = useState(false);

  const requested = new Set(hydrated ? inquiries.map((i) => i.tierId) : []);

  return (
    <>
      <ul className="grid gap-3.5 lg:grid-cols-3 lg:items-start lg:gap-5">
        {tiers.map((tier) => {
          const accent = ACCENT[tier.accent];
          const already = requested.has(tier.id);

          return (
            <li
              key={tier.id}
              className={cn(
                "rounded-card bg-paper shadow-card relative overflow-hidden border-2",
                accent.border,
                tier.featured && "shadow-lift",
              )}
            >
              {tier.featured ? (
                <div className="bg-gold text-espresso flex items-center justify-center gap-1.5 py-1.5 text-[0.66rem] font-bold tracking-[0.14em] uppercase">
                  <Sparkles className="size-3.5" />
                  Most popular
                </div>
              ) : null}

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-[1.35rem] leading-tight font-semibold tracking-[-0.035em]">
                      {tier.name}
                    </h3>
                    <p className="text-muted mt-1 text-[0.82rem] leading-snug text-pretty">
                      {tier.tagline}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("mmg-display text-[1.7rem]", accent.price)}>{tier.price}</p>
                    <p className="text-muted text-[0.68rem] leading-tight font-semibold">
                      {tier.cadence}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "mt-3 inline-flex rounded-full px-2.5 py-[0.2rem] text-[0.66rem] font-bold tracking-[0.06em] uppercase",
                    accent.chip,
                  )}
                >
                  {tier.spotsLeft} {tier.spotsLeft === 1 ? "spot" : "spots"} left
                </span>

                <ul className="mt-3.5 space-y-2 border-t border-[var(--line)] pt-3.5">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2.5">
                      <Check className="text-teal mt-[0.15rem] size-4 shrink-0" />
                      <span className="text-[0.84rem] leading-snug text-pretty">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={already ? "outline" : accent.button}
                  size="lg"
                  block
                  className="mt-4"
                  onClick={() => {
                    setActive(tier);
                    setOpen(true);
                  }}
                >
                  {already ? (
                    <>
                      <Check />
                      Request sent — send another
                    </>
                  ) : (
                    `Select ${tier.name}`
                  )}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Keyed so each tier/open remounts with fresh state from the profile. */}
      <TierInquiryDialog
        key={`${active?.id ?? "none"}-${open ? "open" : "closed"}`}
        tier={active}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
