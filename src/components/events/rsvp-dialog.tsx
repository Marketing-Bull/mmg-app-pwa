"use client";

import { CalendarPlus, Check, Loader2, Minus, Plus, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { downloadIcs } from "@/lib/calendar";
import { roles, site } from "@/lib/content";
import { formatFullDate, formatTimeRange } from "@/lib/format";
import { submitForm, type DeliveryStatus } from "@/lib/forms";
import { useStore } from "@/lib/store";
import type { MMGEvent, RoleId } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Errors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export function RsvpDialog({
  event,
  open,
  onOpenChange,
}: {
  event: MMGEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile, addRsvp } = useStore();
  const { toast } = useToast();

  const [role, setRole] = useState<RoleId>("attorney");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [guests, setGuests] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);

  // Read the profile without depending on it: confirming an RSVP writes the
  // profile back to the store, and depending on it here would re-run this
  // effect and immediately reset the confirmation screen.
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Prefill from the last RSVP so a returning member is two taps from done.
  useEffect(() => {
    if (!open) return;
    setConfirmed(false);
    setDelivery(null);
    setErrors({});
    setGuests(0);
    const saved = profileRef.current;
    if (saved) {
      setRole(saved.role);
      setName(saved.name);
      setEmail(saved.email);
      setPhone(saved.phone);
      setCompany(saved.company);
    }
  }, [open]);

  const returning = Boolean(profile);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!name.trim()) next.name = "We need a name for the door list.";
    if (!email.trim()) next.email = "Required — this is where the confirmation goes.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "That email doesn't look right.";
    if (!phone.trim()) next.phone = "Required so Andrew can reach you.";
    if (!company.trim()) next.company = "Required — it goes on your name tag.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const rsvp = {
      slug: event.slug,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      role,
      guests,
      createdAt: new Date().toISOString(),
    };

    // Confirm optimistically — the attendee list and calendar file are local,
    // so a slow relay never holds up the person standing in a lobby.
    addRsvp(rsvp);
    setConfirmed(true);
    setSubmitting(false);
    downloadIcs(event, site.email);

    const result = await submitForm({
      subject: `RSVP — ${event.title} (${formatFullDate(event.date)})`,
      fields: {
        Name: rsvp.name,
        Email: rsvp.email,
        Phone: rsvp.phone,
        Company: rsvp.company,
        Role: roles.find((r) => r.id === role)?.label ?? role,
        Guests: guests,
        Event: event.title,
        "Event date": formatFullDate(event.date),
        Venue: `${event.venue.name}, ${event.venue.city}, ${event.venue.state}`,
        Source: "MMG app — RSVP",
      },
    });
    setDelivery(result.status);
  };

  const total = 1 + guests;

  const successFooter = useMemo(
    () => (
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          block
          onClick={() => {
            downloadIcs(event, site.email);
            toast({
              tone: "calendar",
              title: "Calendar invite downloaded",
              body: `${event.title} — open the .ics to add it.`,
            });
          }}
        >
          <CalendarPlus />
          Add to calendar
        </Button>
        <Button block onClick={() => onOpenChange(false)}>
          Done
        </Button>
      </div>
    ),
    [event, onOpenChange, toast],
  );

  const formFooter = (
    <div>
      <Button block size="lg" onClick={handleSubmit} disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : null}
        {submitting ? "Confirming…" : `Confirm RSVP${guests ? ` · ${total} spots` : ""}`}
      </Button>
      <p className="text-muted mt-2.5 text-center text-[0.72rem] leading-snug">
        Goes straight to Andrew at {site.email}. No account needed.
      </p>
    </div>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={confirmed ? "You're on the list" : "RSVP"}
      description={
        confirmed
          ? undefined
          : `${event.title} · ${formatFullDate(event.date)}, ${formatTimeRange(event.startTime, event.endTime)}`
      }
      footer={confirmed ? successFooter : formFooter}
    >
      {confirmed ? (
        <SuccessPanel event={event} name={name} total={total} delivery={delivery} />
      ) : (
        <div className="space-y-5">
          {returning ? (
            <p className="bg-teal/10 text-teal-dark rounded-2xl px-3.5 py-2.5 text-[0.78rem] leading-snug">
              Welcome back, {profile?.name.split(" ")[0]}. Your details are filled in — just
              confirm.
            </p>
          ) : null}

          <fieldset>
            <legend className="mb-2 text-[0.78rem] font-semibold tracking-[0.02em]">
              I&rsquo;m attending as <span className="text-red">*</span>
            </legend>
            <div className="grid gap-2">
              {roles.map((option) => {
                const active = role === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRole(option.id)}
                    aria-pressed={active}
                    className={cn(
                      "mmg-press flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                      active
                        ? "border-red bg-red/[0.07]"
                        : "bg-paper hover:bg-sand-light border-[var(--line-strong)]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full text-[0.72rem] font-bold",
                        active ? "bg-red text-cream" : "bg-sand-light text-muted",
                      )}
                    >
                      {option.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.88rem] font-semibold">{option.label}</span>
                      <span className="text-muted block text-[0.74rem] leading-snug">
                        {option.blurb}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        active ? "border-red bg-red text-cream" : "border-[var(--line-strong)]",
                      )}
                    >
                      {active ? <Check className="size-3 stroke-[3]" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-3.5">
            <TextField
              label="Full name"
              required
              autoComplete="name"
              placeholder="Jordan Alvarez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <TextField
              label="Email"
              required
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="jordan@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <TextField
              label="Mobile phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(954) 555-0142"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
            />
            <TextField
              label="Company or firm"
              required
              autoComplete="organization"
              placeholder="Alvarez Injury Law"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              error={errors.company}
            />
          </div>

          <div className="bg-paper flex items-center justify-between rounded-2xl border border-[var(--line-strong)] px-3.5 py-3">
            <div>
              <p className="text-[0.82rem] font-semibold">Bringing anyone?</p>
              <p className="text-muted text-[0.74rem]">Colleagues from your team are welcome.</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(0, g - 1))}
                disabled={guests === 0}
                aria-label="Remove a guest"
                className="mmg-press bg-sand-light text-espresso grid size-9 place-items-center rounded-full disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-7 text-center text-[1rem] font-bold tabular-nums">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(9, g + 1))}
                disabled={guests === 9}
                aria-label="Add a guest"
                className="mmg-press bg-sand-light text-espresso grid size-9 place-items-center rounded-full disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function SuccessPanel({
  event,
  name,
  total,
  delivery,
}: {
  event: MMGEvent;
  name: string;
  total: number;
  delivery: DeliveryStatus | null;
}) {
  const { toast } = useToast();

  const share = async () => {
    const url = `${window.location.origin}/events/${event.slug}`;
    const data = { title: event.title, text: event.summary, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // User dismissed the share sheet — fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ tone: "success", title: "Link copied", body: "Send it to whoever should come." });
    } catch {
      toast({ tone: "warning", title: "Couldn't copy the link", body: url });
    }
  };

  return (
    <div className="text-center">
      <div className="bg-teal/12 mx-auto grid size-[4.5rem] animate-[mmg-pop_0.4s_var(--ease-out-soft)] place-items-center rounded-full">
        <svg viewBox="0 0 48 48" className="size-9" aria-hidden>
          <path
            d="M13 25.5 20.5 33 35 16"
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48"
            className="animate-[mmg-check_0.5s_0.12s_both_var(--ease-out-soft)]"
          />
        </svg>
      </div>

      <h3 className="mt-4 font-serif text-[1.5rem] leading-tight font-semibold tracking-[-0.035em]">
        See you there, {name.split(" ")[0]}.
      </h3>
      <p className="text-muted mx-auto mt-2 max-w-[22rem] text-[0.86rem] leading-relaxed text-pretty">
        {total > 1 ? `${total} spots are` : "Your spot is"} held for{" "}
        <span className="text-espresso font-semibold">{event.title}</span> on{" "}
        {formatFullDate(event.date)}. A calendar invite just downloaded.
      </p>

      <div className="bg-cream mt-5 rounded-2xl border border-[var(--line)] p-3.5 text-left">
        <p className="text-red text-[0.7rem] font-bold tracking-[0.1em] uppercase">Where to go</p>
        <p className="mt-1.5 text-[0.88rem] font-semibold">{event.venue.name}</p>
        <p className="text-muted text-[0.8rem]">
          {event.venue.address}, {event.venue.city}, {event.venue.state} {event.venue.zip}
        </p>
        <p className="text-muted mt-2 text-[0.8rem]">
          {formatTimeRange(event.startTime, event.endTime)} · Name tags at the door
        </p>
      </div>

      <button
        type="button"
        onClick={share}
        className="mmg-press text-red mt-4 inline-flex items-center gap-2 text-[0.82rem] font-semibold"
      >
        <Share2 className="size-4" />
        Invite someone from your team
      </button>

      <DeliveryNote delivery={delivery} />
    </div>
  );
}

function DeliveryNote({ delivery }: { delivery: DeliveryStatus | null }) {
  if (delivery === null) {
    return (
      <p className="text-muted mt-4 flex items-center justify-center gap-1.5 text-[0.72rem]">
        <Loader2 className="size-3 animate-spin" />
        Sending your details to MMG…
      </p>
    );
  }
  if (delivery === "sent") {
    return (
      <p className="text-muted mt-4 text-[0.72rem]">
        Your details are with Andrew. He&rsquo;ll follow up before the event.
      </p>
    );
  }
  if (delivery === "skipped") {
    return (
      <p className="text-muted mt-4 text-[0.72rem]">
        Demo mode — email delivery is turned off in this environment.
      </p>
    );
  }
  // "pending" and "failed" both mean: your spot is held, the email is not our
  // guest's problem. Don't undermine a confirmation they've already been given.
  return (
    <p className="text-muted mt-4 text-[0.72rem]">
      Your spot is held. If you don&rsquo;t hear from MMG, reach Andrew at {site.phone}.
    </p>
  );
}
