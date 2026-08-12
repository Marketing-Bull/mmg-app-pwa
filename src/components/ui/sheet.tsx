"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Modal that behaves like a bottom sheet on phones and a centered dialog on
 * larger screens — the pattern people expect from an installed app.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-espresso/45 fixed inset-0 z-50 backdrop-blur-[3px] data-[state=open]:animate-[mmg-fade-up_0.2s_var(--ease-out-soft)]" />
        <Dialog.Content
          className={cn(
            "bg-paper shadow-mmg fixed z-50 flex flex-col outline-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[1.75rem]",
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[30rem] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.5rem]",
            "data-[state=open]:animate-[mmg-fade-up_0.28s_var(--ease-out-soft)]",
            className,
          )}
        >
          <div className="relative shrink-0 border-b border-[var(--line)] px-5 pt-3 pb-4 sm:px-6 sm:pt-5">
            {/* Grab handle reads as "swipeable" on touch. */}
            <div aria-hidden className="bg-sand mx-auto mb-3 h-1 w-10 rounded-full sm:hidden" />
            <Dialog.Title className="pr-10 font-serif text-[1.4rem] leading-tight font-semibold tracking-[-0.03em]">
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="text-muted mt-1.5 pr-10 text-[0.85rem] leading-relaxed">
                {description}
              </Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">{title}</Dialog.Description>
            )}
            <Dialog.Close
              aria-label="Close"
              className="mmg-press bg-sand-light text-espresso hover:bg-sand absolute top-3 right-4 grid size-9 place-items-center rounded-full sm:top-5"
            >
              <X className="size-[1.1rem]" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

          {footer ? (
            <div className="bg-cream/70 shrink-0 border-t border-[var(--line)] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:rounded-b-[1.5rem] sm:px-6 sm:pb-4">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
