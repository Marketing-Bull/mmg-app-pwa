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
        "bg-paper grid h-[4.5rem] place-items-center rounded-2xl border border-[var(--line)] px-3 py-2 lg:h-[5.5rem] lg:px-5",
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
          className="max-h-11 w-auto object-contain lg:max-h-14"
        />
      ) : (
        <span className="text-espresso/75 text-center text-[0.7rem] leading-tight font-bold tracking-[0.02em] uppercase">
          {partner.name}
        </span>
      )}
    </div>
  );
}

export function PartnerWall({
  partners,
  /** Desktop column count — narrower content columns need fewer. */
  columns = 6,
}: {
  partners: Partner[];
  columns?: 3 | 4 | 6;
}) {
  const desktopCols =
    columns === 3 ? "lg:grid-cols-3" : columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-6";

  return (
    <ul className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:gap-4", desktopCols)}>
      {partners.map((partner) => (
        <li key={partner.id}>
          <PartnerTile partner={partner} />
        </li>
      ))}
    </ul>
  );
}
