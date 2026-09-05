import type { SVGProps } from "react";

/*
 * lucide-react dropped every brand glyph in v1, so the Instagram mark used by
 * the host card, the footer, the contact list and the recap link is no longer
 * in the icon set. This redraws it at lucide's own metrics — 24px box, 2px
 * round-capped strokes, currentColor — so those call sites keep sizing and
 * colouring it with the same utility classes they always did.
 */
export function InstagramIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
