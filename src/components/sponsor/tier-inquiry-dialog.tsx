"use client";

import { Check, Loader2, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { site } from "@/lib/content";
import { submitForm, type DeliveryStatus } from "@/lib/forms";
import { useStore } from "@/lib/store";
import type { SponsorTier } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function TierInquiryDialog({
  tier,
  open,
  onOpenChange,
}: {
  tier: SponsorTier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile, addInquiry } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);

  // Not a dependency: sending an inquiry can write the profile back to the
  // store, which would otherwise re-run this effect and clear the success screen.
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (!open) return;
    setSent(false);
    setDelivery(null);
    setErrors({});
    setMessage("");
    const saved = profileRef.current;
    if (saved) {
      setName(saved.name);
      setEmail(saved.email);
      setPhone(saved.phone);
      setCompany(saved.company);
    }
  }, [open]);

  if (!tier) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Required.";
    if (!email.trim()) next.email = "Required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "That email doesn't look right.";
    if (!company.trim()) next.company = "Required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const inquiry = {
      tierId: tier.id,
      tierName: tier.name,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    addInquiry(inquiry);
    setSent(true);
    setSubmitting(false);

    const result = await submitForm({
      subject: `Sponsorship inquiry — ${tier.name} (${tier.price} ${tier.cadence})`,
      fields: {
        Tier: `${tier.name} — ${tier.price} ${tier.cadence}`,
        Name: inquiry.name,
        Company: inquiry.company,
        Email: inquiry.email,
        Phone: inquiry.phone,
        Message: inquiry.message,
        Source: "MMG app — sponsorship",
      },
    });
    setDelivery(result.status);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={sent ? "Request sent" : `Sponsor: ${tier.name}`}
      description={
        sent ? undefined : `${tier.price} ${tier.cadence} · ${tier.spotsLeft} remaining this quarter`
      }
      footer={
        sent ? (
          <div className="flex gap-2.5">
            <Button asChild variant="outline" block>
              <a href={`tel:${site.phone.replace(/\D/g, "")}`}>
                <Phone />
                Call Andrew
              </a>
            </Button>
            <Button block onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <Button block size="lg" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : null}
            {submitting ? "Sending…" : "Send sponsorship request"}
          </Button>
        )
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto grid size-[4.5rem] place-items-center rounded-full bg-gold/25 animate-[mmg-pop_0.4s_var(--ease-out-soft)]">
            <Check className="size-9 stroke-[3] text-[#8f5c07]" />
          </div>
          <h3 className="mt-4 font-serif text-[1.45rem] leading-tight font-semibold tracking-[-0.035em]">
            Andrew will be in touch.
          </h3>
          <p className="mx-auto mt-2 max-w-[22rem] text-[0.86rem] leading-relaxed text-muted text-pretty">
            Your interest in the{" "}
            <span className="font-semibold text-espresso">{tier.name}</span> tier is on its way to{" "}
            {site.email}. Andrew personally reviews sponsorship requests and follows up to talk
            through the fit.
          </p>

          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-cream p-3.5 text-left">
            <p className="text-[0.7rem] font-bold tracking-[0.1em] text-red uppercase">
              What you asked about
            </p>
            <p className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[0.9rem] font-semibold">{tier.name}</span>
              <span className="text-[0.9rem] font-semibold text-red">{tier.price}</span>
            </p>
            <p className="text-[0.78rem] text-muted">{tier.cadence}</p>
          </div>

          {delivery === null ? (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.72rem] text-muted">
              <Loader2 className="size-3 animate-spin" />
              Sending…
            </p>
          ) : delivery === "sent" ? (
            <p className="mt-4 text-[0.72rem] text-muted">Delivered to the MMG inbox.</p>
          ) : delivery === "skipped" ? (
            <p className="mt-4 text-[0.72rem] text-muted">
              Demo mode — email delivery is turned off in this environment.
            </p>
          ) : (
            <p className="mt-4 text-[0.72rem] text-muted">
              If you don&rsquo;t hear back within two business days, call {site.phone}.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-cream p-3.5">
            <p className="text-[0.7rem] font-bold tracking-[0.1em] text-red uppercase">
              You&rsquo;re asking about
            </p>
            <p className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[0.95rem] font-semibold">{tier.name}</span>
              <span className="text-[0.95rem] font-semibold text-red">{tier.price}</span>
            </p>
            <p className="text-[0.78rem] text-muted">{tier.cadence}</p>
            <ul className="mt-2.5 space-y-1 border-t border-[var(--line)] pt-2.5">
              {tier.benefits.slice(0, 3).map((benefit) => (
                <li key={benefit} className="flex gap-2 text-[0.78rem] leading-snug text-muted">
                  <Check className="mt-[0.15rem] size-3.5 shrink-0 text-teal" />
                  {benefit}
                </li>
              ))}
              {tier.benefits.length > 3 ? (
                <li className="pl-[1.375rem] text-[0.75rem] text-muted/75">
                  + {tier.benefits.length - 3} more
                </li>
              ) : null}
            </ul>
          </div>

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
              label="Company"
              required
              autoComplete="organization"
              placeholder="Alvarez Diagnostics"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              error={errors.company}
            />
            <TextField
              label="Email"
              required
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="jordan@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <TextField
              label="Mobile phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(954) 555-0142"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextAreaField
              label="Anything Andrew should know?"
              hint="Which events you're eyeing, who you want to reach, budget questions."
              placeholder="We're a diagnostic imaging group in Broward looking to reach plaintiff firms…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
      )}
    </Sheet>
  );
}
