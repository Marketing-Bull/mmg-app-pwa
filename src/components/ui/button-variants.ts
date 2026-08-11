import { cva, type VariantProps } from "class-variance-authority";

/**
 * Kept out of button.tsx (a client module) so server components can style a
 * plain <Link> with button classes without pulling in a client boundary.
 */
export const buttonVariants = cva(
  "mmg-press inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap disabled:pointer-events-none disabled:opacity-55 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-red text-cream shadow-[0_8px_22px_rgba(165,46,42,0.28)] hover:bg-red-dark",
        espresso: "bg-espresso text-cream hover:bg-[#160f0d]",
        outline: "border border-[var(--line-strong)] bg-paper text-espresso hover:bg-sand-light",
        ghost: "text-espresso hover:bg-sand-light",
        sand: "bg-sand text-espresso hover:bg-[#e0cdae]",
        gold: "bg-gold text-espresso hover:bg-mango",
      },
      size: {
        sm: "h-9 px-4 text-[0.8rem] [&_svg]:size-4",
        md: "h-11 px-5 text-[0.9rem] [&_svg]:size-[1.05rem]",
        lg: "h-[3.25rem] px-6 text-[0.95rem] [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-[1.15rem]",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
