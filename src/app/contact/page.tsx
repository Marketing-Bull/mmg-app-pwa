import { ExternalLink, Instagram, Mail, MapPin, Phone, Ticket } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { HostCard } from "@/components/shared/host-card";
import { PageIntro, Section } from "@/components/shared/section";
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
        <PageIntro eyebrow="Start with a conversation" title="Who do you want to meet?">
          Tell Andrew about your business, the relationships you want to build, and the
          opportunities you are exploring. He will follow up to schedule a conversation and
          recommend the right next step.
        </PageIntro>

        <Section className="pt-5">
          <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-4">
            {channels.map((channel) => (
              <li key={`${channel.label}-${channel.sub}`}>
                <a
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer" : undefined}
                  className="mmg-press rounded-card bg-paper shadow-card flex h-full flex-col gap-1.5 border border-[var(--line)] p-3.5"
                >
                  <channel.icon className="text-red size-[1.15rem]" />
                  <span className="text-[0.84rem] leading-snug font-semibold">
                    {channel.label}
                    {channel.external ? (
                      <ExternalLink className="text-muted ml-1 inline size-3 align-baseline" />
                    ) : null}
                  </span>
                  <span className="text-muted text-[0.72rem] leading-snug break-words">
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
      </main>
    </>
  );
}
