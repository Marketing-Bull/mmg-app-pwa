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
    <section id={id} className={cn("px-4 py-7", className)}>
      {eyebrow || title || action ? (
        <header className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? <p className="mmg-eyebrow">{eyebrow}</p> : null}
            {title ? (
              <h2 className="mt-1.5 font-serif text-[1.55rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance">
                {title}
              </h2>
            ) : null}
          </div>
          {action ? (
            <Link
              href={action.href}
              className="mmg-press text-red hover:text-red-dark shrink-0 pb-1 text-[0.78rem] font-semibold"
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
