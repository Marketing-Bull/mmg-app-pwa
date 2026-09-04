import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  eyebrow,
  title,
  children,
  action,
  className,
  id,
}: {
  eyebrow?: string;
  title?: ReactNode;
  children: ReactNode;
  action?: { href: string; label: string };
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mmg-shell py-5 lg:py-12", className)}>
      {eyebrow || title || action ? (
        <header className="mb-3 flex items-end justify-between gap-3 lg:mb-7">
          <div className="min-w-0">
            {eyebrow ? <p className="mmg-eyebrow">{eyebrow}</p> : null}
            {title ? (
              <h2 className="mt-1 max-w-3xl font-serif text-[1.3rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance lg:mt-1.5 lg:text-[2.4rem]">
                {title}
              </h2>
            ) : null}
          </div>
          {action ? (
            <Link
              href={action.href}
              className="mmg-press text-red hover:text-red-dark shrink-0 pb-1 text-[0.78rem] font-semibold lg:text-[0.9rem]"
            >
              {action.label}
            </Link>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Page intro block — the eyebrow + h1 + standfirst that opens most routes.
 *
 * Kept short on phones: the AppBar already names the screen, so a full-height
 * magazine headline here would just push the actual content below the fold.
 * Desktop, where there is room, still gets the display treatment.
 */
export function PageIntro({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mmg-shell pt-3 lg:pt-14", className)}>
      <p className="mmg-eyebrow">{eyebrow}</p>
      <h1 className="mt-1 max-w-4xl font-serif text-[1.55rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance lg:mt-1.5 lg:text-[3.4rem]">
        {title}
      </h1>
      {children ? (
        <div className="text-muted mt-2 max-w-2xl text-[0.83rem] leading-snug text-pretty lg:mt-5 lg:text-[1.05rem] lg:leading-relaxed">
          {children}
        </div>
      ) : null}
    </div>
  );
}
