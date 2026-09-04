import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Grouped inset list — the container every phone OS uses for settings and detail. */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mmg-list", className)}>{children}</div>;
}

export function ListRow({
  href,
  external,
  icon: Icon,
  label,
  sub,
  value,
  trailing,
  chevron,
  className,
}: {
  href?: string;
  external?: boolean;
  icon?: ComponentType<{ className?: string }>;
  label: ReactNode;
  sub?: ReactNode;
  /** Right-aligned secondary value, the way a settings row shows its state. */
  value?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {Icon ? (
        <span className="bg-sand-light grid size-9 shrink-0 place-items-center rounded-xl">
          <Icon className="text-red size-[1.05rem]" />
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="block text-[0.88rem] leading-snug font-semibold">{label}</span>
        {sub ? (
          <span className="text-muted mt-0.5 block text-[0.75rem] leading-snug break-words">
            {sub}
          </span>
        ) : null}
      </span>

      {value ? (
        <span className="text-muted shrink-0 text-[0.8rem] font-medium">{value}</span>
      ) : null}
      {trailing}
      {(chevron ?? Boolean(href)) ? (
        <ChevronRight className="text-muted/60 size-4 shrink-0" />
      ) : null}
    </>
  );

  const classes = cn("mmg-row mmg-press", className);

  if (!href) return <div className={cn("mmg-row", className)}>{body}</div>;

  if (
    external ||
    href.startsWith("http") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:")
  ) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={classes}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {body}
    </Link>
  );
}
