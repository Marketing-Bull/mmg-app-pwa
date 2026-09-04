"use client";

import { Check, Loader2, SendHorizonal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { site } from "@/lib/site";
import { submitForm, type DeliveryStatus } from "@/lib/forms";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INTERESTS = [
  "Marketing partnership",
  "Event sponsorship",
  "Consulting",
  "General consultation",
] as const;

/**
 * Waits for the store to hydrate, then mounts the form keyed on that, so the
 * fields can seed straight from the saved profile instead of being back-filled
 * by an effect.
 */
export function ContactForm() {
  const { hydrated } = useStore();
  return <ContactFormFields key={hydrated ? "hydrated" : "initial"} />;
}

function ContactFormFields() {
  const { profile, setProfile } = useStore();
  const { toast } = useToast();

  const [name, setName] = useState(profile?.name ?? "");
  const [company, setCompany] = useState(profile?.company ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [interest, setInterest] = useState<string>(INTERESTS[3]);
  const [message, setMessage] = useState("");
  // Honeypot — bots fill hidden fields, people don't.
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Required.";
    if (!email.trim()) next.email = "Required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "That email doesn't look right.";
    if (!message.trim()) next.message = "Tell Andrew a little about what you're after.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (website) return; // honeypot tripped
    if (!validate()) return;
    setSubmitting(true);
    setSent(true);
    setSubmitting(false);

    setProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      role: profile?.role ?? "attorney",
    });

    toast({
      tone: "success",
      title: "Message sent",
      body: "Andrew personally reviews these and follows up.",
    });

    const result = await submitForm({
      subject: `App enquiry — ${interest}`,
      fields: {
        Name: name.trim(),
        Company: company.trim(),
        Email: email.trim(),
        Phone: phone.trim(),
        "Area of interest": interest,
        Message: message.trim(),
        Source: "MMG app — contact",
      },
    });
    setDelivery(result.status);
  };

  if (sent) {
    return (
      <div className="rounded-card bg-paper shadow-card border border-[var(--line)] p-6 text-center">
        <div className="bg-teal/12 mx-auto grid size-[4.5rem] animate-[mmg-pop_0.4s_var(--ease-out-soft)] place-items-center rounded-full">
          <Check className="text-teal size-9 stroke-[3]" />
        </div>
        <h3 className="mt-4 font-serif text-[1.45rem] leading-tight font-semibold tracking-[-0.035em]">
          Message on its way.
        </h3>
        <p className="text-muted mx-auto mt-2 max-w-[24rem] text-[0.86rem] leading-relaxed text-pretty">
          Andrew personally reviews consultation requests and follows up to schedule a conversation.
          In the meantime, {site.phone} reaches him directly.
        </p>

        {delivery === null ? (
          <p className="text-muted mt-4 flex items-center justify-center gap-1.5 text-[0.72rem]">
            <Loader2 className="size-3 animate-spin" />
            Sending…
          </p>
        ) : delivery === "sent" ? (
          <p className="text-muted mt-4 text-[0.72rem]">Delivered to {site.email}.</p>
        ) : delivery === "skipped" ? (
          <p className="text-muted mt-4 text-[0.72rem]">
            Demo mode — email delivery is turned off in this environment.
          </p>
        ) : (
          <p className="text-muted mt-4 text-[0.72rem]">
            If you don&rsquo;t hear back within two business days, call {site.phone}.
          </p>
        )}

        <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card bg-paper shadow-card border border-[var(--line)] p-4">
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
          autoComplete="organization"
          placeholder="Alvarez Injury Law"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
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
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(954) 555-0142"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <fieldset>
          <legend className="mb-2 text-[0.78rem] font-semibold tracking-[0.02em]">
            Area of interest
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {INTERESTS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setInterest(option)}
                aria-pressed={interest === option}
                className={cn(
                  "mmg-press rounded-2xl border px-3 py-2.5 text-[0.8rem] leading-snug font-semibold transition-colors",
                  interest === option
                    ? "border-red bg-red/[0.07] text-red"
                    : "bg-cream text-muted hover:text-espresso border-[var(--line-strong)]",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <TextAreaField
          label="Tell Andrew a little more"
          required
          placeholder="Who do you want to meet, and what are you working toward?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={errors.message}
        />

        <div aria-hidden className="hidden">
          <label htmlFor="website-hp">Leave this field empty</label>
          <input
            id="website-hp"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </div>

      <Button size="lg" block className="mt-5" onClick={submit} disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
        Send request
      </Button>

      <p className="text-muted mt-3 text-center text-[0.72rem] leading-relaxed">
        By submitting, you agree that MMG may contact you about your request. Goes straight to{" "}
        {site.email}.
      </p>
    </div>
  );
}
