import Image from "next/image";
import type { Partner } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Partners with a supplied logo show it; the rest get a typographic tile so the
 * wall stays even instead of mixing images with bare text.
 */
export function PartnerTile({ partner, className }: { partner: Partner; className?: string }) {
  return (
    <div
      className={cn(
        "grid h-[4.5rem] place-items-center rounded-2xl border border-[var(--line)] bg-paper px-3 py-2",
        className,
      )}
    >
      {partner.logo ? (
        <Image
          src={partner.logo.src}
          alt={partner.logo.alt}
          width={150}
          height={57}
          sizes="150px"
          className="max-h-11 w-auto object-contain"
        />
      ) : (
        <span className="text-center text-[0.7rem] leading-tight font-bold tracking-[0.02em] text-espresso/75 uppercase">
          {partner.name}
        </span>
      )}
    </div>
  );
}

export function PartnerWall({ partners }: { partners: Partner[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {partners.map((partner) => (
        <li key={partner.id}>
          <PartnerTile partner={partner} />
        </li>
      ))}
    </ul>
  );
}
