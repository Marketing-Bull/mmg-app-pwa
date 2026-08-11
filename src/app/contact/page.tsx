import { ExternalLink, Instagram, Mail, MapPin, Phone, Ticket } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { HostCard } from "@/components/shared/host-card";
import { Section } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { getHost, hosts, site } from "@/lib/content";
import { DemoTools } from "@/components/shell/demo-tools";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Andrew Miller and Miller's Marketing Group — phone, email, Instagram, and Eventbrite.",
};

export default function ContactPage() {
  const host = getHost("andrew-miller") ?? hosts[0];

  const channels = [
    {
      icon: Phone,
      label: site.phone,
      sub: "Andrew, direct",
      href: `tel:${site.phone.replace(/\D/g, "")}`,
    },
    {
      icon: Phone,
      label: site.phoneAlt,
      sub: "Office",
      href: `tel:${site.phoneAlt.replace(/\D/g, "")}`,
    },
    {
      icon: Mail,
      label: "Email MMG",
      sub: site.email,
      href: `mailto:${site.email}`,
    },
    {
      icon: Instagram,
      label: "Instagram",
      sub: "@millers_marketing_group34",
      href: site.instagram,
      external: true,
    },
    {
      icon: Ticket,
      label: "Eventbrite",
      sub: "All published dates",
      href: site.eventbrite,
      external: true,
    },
    {
      icon: MapPin,
      label: site.address,
      sub: "Office",
      href: `https://maps.google.com/?q=${encodeURIComponent(site.address)}`,
      external: true,
    },
  ];

  return (
    <>
      <AppBar title="Contact" />

      <main className="pb-tabbar">
        <div className="px-4 pt-4">
          <p className="mmg-eyebrow">Start with a conversation</p>
          <h1 className="mt-1.5 font-serif text-[2rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
            Who do you want to meet?
          </h1>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-muted text-pretty">
            Tell Andrew about your business, the relationships you want to build, and the
            opportunities you are exploring. He will follow up to schedule a conversation and
            recommend the right next step.
          </p>
        </div>

        <Section className="pt-5">
          <ul className="grid grid-cols-2 gap-2.5">
            {channels.map((channel) => (
              <li key={`${channel.label}-${channel.sub}`}>
                <a
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer" : undefined}
                  className="mmg-press flex h-full flex-col gap-1.5 rounded-card border border-[var(--line)] bg-paper p-3.5 shadow-card"
                >
                  <channel.icon className="size-[1.15rem] text-red" />
                  <span className="text-[0.84rem] leading-snug font-semibold">
                    {channel.label}
                    {channel.external ? (
                      <ExternalLink className="ml-1 inline size-3 align-baseline text-muted" />
                    ) : null}
                  </span>
                  <span className="text-[0.72rem] leading-snug break-words text-muted">
                    {channel.sub}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Send a message" title="Andrew reads every one.">
          <ContactForm />
        </Section>

        <Section eyebrow="Who you're talking to" title="A connector by nature.">
          <HostCard host={host} />
        </Section>

        <Section eyebrow="Demo controls" title="Testing the app?">
          <DemoTools />
        </Section>

        <footer className="px-4 pb-6 text-center">
          <p className="text-[0.7rem] leading-relaxed text-muted/80 text-pretty">
            {site.disclaimer}
          </p>
          <p className="mt-2 text-[0.7rem] text-muted/70">
            © {new Date().getFullYear()} {site.name}
          </p>
        </footer>
      </main>
    </>
  );
}
