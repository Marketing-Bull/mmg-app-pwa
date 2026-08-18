import { Instagram, Mail, Phone } from "lucide-react";
import Image from "next/image";
import type { Host } from "@/lib/types";

export function HostCard({ host, compact }: { host: Host; compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-card bg-paper shadow-card flex items-center gap-3 border border-[var(--line)] p-3.5">
        <Image
          src={host.portrait.src}
          alt={host.portrait.alt}
          width={56}
          height={56}
          sizes="56px"
          className="size-14 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-red text-[0.7rem] font-bold tracking-[0.1em] uppercase">Hosted by</p>
          <p className="text-[0.95rem] font-semibold">{host.name}</p>
          <p className="text-muted truncate text-[0.76rem]">{host.title}</p>
        </div>
        {host.phone ? (
          <a
            href={`tel:${host.phone.replace(/\D/g, "")}`}
            aria-label={`Call ${host.name}`}
            className="mmg-press bg-sand-light text-espresso hover:bg-sand grid size-10 shrink-0 place-items-center rounded-full"
          >
            <Phone className="size-[1.05rem]" />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    // Stacked on phones; a portrait column beside the bio from lg up.
    <div className="rounded-card bg-paper shadow-card overflow-hidden border border-[var(--line)] lg:grid lg:grid-cols-[20rem_1fr]">
      <div className="relative hidden lg:block">
        <Image
          src={host.portrait.src}
          alt={host.portrait.alt}
          fill
          sizes="20rem"
          className="object-cover"
        />
      </div>

      <div className="lg:p-8">
        <div className="flex gap-4 p-4 lg:p-0">
          <Image
            src={host.portrait.src}
            alt={host.portrait.alt}
            width={96}
            height={96}
            sizes="96px"
            className="size-24 shrink-0 rounded-2xl object-cover lg:hidden"
          />
          <div className="min-w-0 flex-1">
            <p className="mmg-eyebrow">Meet your host</p>
            <h3 className="mt-1 font-serif text-[1.35rem] leading-tight font-semibold tracking-[-0.035em] lg:text-[2rem]">
              {host.name}
            </h3>
            <p className="text-muted mt-0.5 text-[0.78rem] lg:text-[0.95rem]">{host.title}</p>
          </div>
        </div>

        <div className="space-y-2.5 px-4 pb-1 lg:mt-5 lg:space-y-4 lg:px-0 lg:pb-0">
          {host.bio.map((paragraph) => (
            <p
              key={paragraph}
              className="text-muted text-[0.86rem] leading-relaxed text-pretty lg:text-[1rem]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {host.quote ? (
          <blockquote className="border-red text-espresso mx-4 my-4 border-l-2 pl-3.5 font-serif text-[1.05rem] leading-snug tracking-[-0.02em] lg:mx-0 lg:my-6 lg:pl-5 lg:text-[1.35rem]">
            &ldquo;{host.quote}&rdquo;
          </blockquote>
        ) : null}
      </div>

      <div className="bg-cream/60 flex flex-wrap gap-2 border-t border-[var(--line)] p-3.5 lg:col-span-2 lg:px-8">
        {host.phone ? (
          <a
            href={`tel:${host.phone.replace(/\D/g, "")}`}
            className="mmg-press bg-paper shadow-card inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.78rem] font-semibold"
          >
            <Phone className="text-red size-3.5" />
            {host.phone}
          </a>
        ) : null}
        {host.email ? (
          <a
            href={`mailto:${host.email}`}
            className="mmg-press bg-paper shadow-card inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.78rem] font-semibold"
          >
            <Mail className="text-red size-3.5" />
            Email
          </a>
        ) : null}
        {host.instagram ? (
          <a
            href={host.instagram}
            target="_blank"
            rel="noreferrer"
            className="mmg-press bg-paper shadow-card inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.78rem] font-semibold"
          >
            <Instagram className="text-red size-3.5" />
            Instagram
          </a>
        ) : null}
      </div>
    </div>
  );
}
