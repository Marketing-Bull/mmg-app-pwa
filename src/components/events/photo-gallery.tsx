"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { RecapPhoto } from "@/lib/types";

export function PhotoGallery({ photos }: { photos: RecapPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  if (photos.length === 0) return null;
  const active = index === null ? null : photos[index];

  return (
    <>
      <ul className="grid grid-cols-2 gap-2.5">
        {photos.map((photo, i) => (
          <li key={photo.src} className={photos.length === 1 ? "col-span-2" : undefined}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="mmg-press group bg-sand-light relative block aspect-[4/3] w-full overflow-hidden rounded-2xl"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 640px) 21rem, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              {photo.caption ? (
                <>
                  <span
                    aria-hidden
                    className="from-espresso/80 absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t to-transparent"
                  />
                  <span className="text-cream absolute inset-x-0 bottom-0 p-2.5 text-left text-[0.7rem] leading-snug font-medium">
                    {photo.caption}
                  </span>
                </>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={index !== null} onOpenChange={(open) => !open && close()}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-espresso/92 fixed inset-0 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 z-50 flex flex-col outline-none">
            <Dialog.Title className="sr-only">Event photo</Dialog.Title>
            <Dialog.Description className="sr-only">
              {active?.alt ?? "Event photo"}
            </Dialog.Description>

            <div className="flex justify-end p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
              <Dialog.Close
                aria-label="Close"
                className="mmg-press bg-cream/15 text-cream grid size-10 place-items-center rounded-full backdrop-blur"
              >
                <X className="size-5" />
              </Dialog.Close>
            </div>

            <div className="relative min-h-0 flex-1">
              {active ? (
                <Image
                  src={active.src}
                  alt={active.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              ) : null}
            </div>

            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] text-center">
              {active?.caption ? (
                <p className="text-cream/85 mx-auto max-w-md text-[0.82rem] leading-snug text-pretty">
                  {active.caption}
                </p>
              ) : null}
              {photos.length > 1 ? (
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous photo"
                    className="mmg-press bg-cream/15 text-cream grid size-11 place-items-center rounded-full backdrop-blur"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <span className="text-cream/70 text-[0.78rem] font-semibold tabular-nums">
                    {(index ?? 0) + 1} / {photos.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next photo"
                    className="mmg-press bg-cream/15 text-cream grid size-11 place-items-center rounded-full backdrop-blur"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
