import { Instagram, Mail, Phone } from "lucide-react";
import Image from "next/image";
import type { Host } from "@/lib/types";

export function HostCard({ host, compact }: { host: Host; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-[var(--line)] bg-paper p-3.5 shadow-card">
        <Image
          src={host.portrait.src}
          alt={host.portrait.alt}
          width={56}
          height={56}
          sizes="56px"
          className="size-14 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-bold tracking-[0.1em] text-red uppercase">Hosted by</p>
          <p className="text-[0.95rem] font-semibold">{host.name}</p>
          <p className="truncate text-[0.76rem] text-muted">{host.title}</p>
        </div>
        {host.phone ? (
          <a
            href={`tel:${host.phone.replace(/\D/g, "")}`}
            aria-label={`Call ${host.name}`}
            className="mmg-press grid size-10 shrink-0 place-items-center rounded-full bg-sand-light text-espresso hover:bg-sand"
          >
            <Phone className="size-[1.05rem]" />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-[var(--line)] bg-paper shadow-card">
      <div className="flex gap-4 p-4">
        <Image
          src={host.portrait.src}
          alt={host.portrait.alt}
          width={96}
          height={96}
          sizes="96px"
          className="size-24 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="mmg-eyebrow">Meet your host</p>
          <h3 className="mt-1 font-serif text-[1.35rem] leading-tight font-semibold tracking-[-0.035em]">
            {host.name}
          </h3>
          <p className="mt-0.5 text-[0.78rem] text-muted">{host.title}</p>
        </div>
      </div>

      <div className="space-y-2.5 px-4 pb-1">
        {host.bio.map((paragraph) => (
          <p key={paragraph} className="text-[0.86rem] leading-relaxed text-muted text-pretty">
            {paragraph}
          </p>
        ))}
      </div>

      {host.quote ? (
        <blockquote className="mx-4 my-4 border-l-2 border-red pl-3.5 font-serif text-[1.05rem] leading-snug tracking-[-0.02em] text-espresso">
          &ldquo;{host.quote}&rdquo;
        </blockquote>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-[var(--line)] bg-cream/60 p-3.5">
        {host.phone ? (
          <a
            href={`tel:${host.phone.replace(/\D/g, "")}`}
            className="mmg-press inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-2 text-[0.78rem] font-semibold shadow-card"
          >
            <Phone className="size-3.5 text-red" />
            {host.phone}
          </a>
        ) : null}
        {host.email ? (
          <a
            href={`mailto:${host.email}`}
            className="mmg-press inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-2 text-[0.78rem] font-semibold shadow-card"
          >
            <Mail className="size-3.5 text-red" />
            Email
          </a>
        ) : null}
        {host.instagram ? (
          <a
            href={host.instagram}
            target="_blank"
            rel="noreferrer"
            className="mmg-press inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-2 text-[0.78rem] font-semibold shadow-card"
          >
            <Instagram className="size-3.5 text-red" />
            Instagram
          </a>
        ) : null}
      </div>
    </div>
  );
}
