import { Instagram, Mail, MapPin, MessageSquare, Phone, Ticket } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { HostCard } from "@/components/shared/host-card";
import { PageIntro } from "@/components/shared/section";
import { AppBar } from "@/components/shell/app-bar";
import { DemoTools } from "@/components/shell/demo-tools";
import { Disclosure } from "@/components/ui/disclosure";
import { List, ListRow } from "@/components/ui/list";
import { Segmented } from "@/components/ui/segmented";
import { getHost, hosts, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Andrew Miller and Miller's Marketing Group — phone, email, Instagram, and Eventbrite.",
};

export default function ContactPage() {
  const host = getHost("andrew-miller") ?? hosts[0];
  const digits = (value: string) => value.replace(/\D/g, "");

  return (
    <>
      <AppBar title="Contact" subtitle={site.phone} />

      <main className="pb-tabbar">
        <PageIntro eyebrow="Start with a conversation" title="Who do you want to meet?">
          Tell Andrew about your business and the relationships you want to build. He follows up
          personally.
        </PageIntro>

        {/* Two taps that need no form at all, right at the top. */}
        <div className="mmg-shell pt-3">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${digits(site.phone)}`}
              className="mmg-press bg-red text-cream shadow-card flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[0.86rem] font-semibold"
            >
              <Phone className="size-[1.05rem]" />
              Call Andrew
            </a>
            <a
              href={`sms:${digits(site.phone)}`}
              className="mmg-press bg-paper shadow-card flex items-center justify-center gap-2 rounded-2xl border border-[var(--line)] px-3 py-3 text-[0.86rem] font-semibold"
            >
              <MessageSquare className="text-red size-[1.05rem]" />
              Text
            </a>
          </div>
        </div>

        <Segmented
          panelClassName="mmg-shell pt-3 pb-3"
          segments={[
            {
              value: "message",
              label: "Message",
              content: <ContactForm />,
            },
            {
              value: "channels",
              label: "Channels",
              content: (
                <List>
                  <ListRow
                    icon={Phone}
                    href={`tel:${digits(site.phone)}`}
                    label={site.phone}
                    sub="Andrew, direct"
                  />
                  <ListRow
                    icon={Phone}
                    href={`tel:${digits(site.phoneAlt)}`}
                    label={site.phoneAlt}
                    sub="Office"
                  />
                  <ListRow
                    icon={Mail}
                    href={`mailto:${site.email}`}
                    label="Email MMG"
                    sub={site.email}
                  />
                  <ListRow
                    icon={Instagram}
                    href={site.instagram}
                    external
                    label="Instagram"
                    sub="@millers_marketing_group34"
                  />
                  <ListRow
                    icon={Ticket}
                    href={site.eventbrite}
                    external
                    label="Eventbrite"
                    sub="All published dates"
                  />
                  <ListRow
                    icon={MapPin}
                    href={`https://maps.google.com/?q=${encodeURIComponent(site.address)}`}
                    external
                    label={site.address}
                    sub="Office"
                  />
                </List>
              ),
            },
            {
              value: "about",
              label: "About Andrew",
              content: (
                <>
                  <HostCard host={host} />
                  <div className="mt-3">
                    <Disclosure summary="Testing the app?" sub="Demo controls">
                      <DemoTools />
                    </Disclosure>
                  </div>
                </>
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
