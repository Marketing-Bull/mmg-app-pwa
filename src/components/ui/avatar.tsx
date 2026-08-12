import { avatarTone, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-[0.68rem]",
  md: "size-10 text-[0.78rem]",
  lg: "size-12 text-[0.9rem]",
} as const;

export function Avatar({
  name,
  size = "md",
  className,
  ring,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Adds a paper ring — used when avatars overlap in a stack. */
  ring?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold tracking-[0.03em] select-none",
        SIZES[size],
        avatarTone(name),
        ring && "ring-paper ring-2",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 5,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = names.slice(0, max);
  return (
    <div className="flex -space-x-2">
      {shown.map((name, index) => (
        <Avatar key={`${name}-${index}`} name={name} size={size} ring />
      ))}
    </div>
  );
}
