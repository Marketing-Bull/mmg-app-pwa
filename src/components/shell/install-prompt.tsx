"use client";

import { Share, SquarePlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mmg-install-dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari predates the display-mode media query.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  // Chrome/Firefox on iOS can't install, so only offer the tip in Safari.
  return iOS && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* storage blocked — just show the prompt */
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS never fires beforeinstallprompt; show the manual tip after a beat so
    // it doesn't compete with first paint.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIosSafari()) timer = setTimeout(() => setShowIosTip(true), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDeferred(null);
    setShowIosTip(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* nothing to persist */
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }, [deferred, dismiss]);

  if (!deferred && !showIosTip) return null;

  return (
    <div
      className="fixed inset-x-0 z-50 px-4"
      style={{ bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <div className="mx-auto flex max-w-[26rem] items-center gap-3 rounded-2xl border border-[var(--line)] bg-paper px-3.5 py-3 shadow-mmg">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-espresso">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/brand/mmg-official-logo.webp" alt="" className="h-5 w-auto" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.84rem] leading-snug font-semibold">Add MMG to your home screen</p>
          {showIosTip ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[0.75rem] leading-snug text-muted">
              Tap <Share className="inline size-3.5" /> then
              <span className="inline-flex items-center gap-0.5 font-medium text-espresso">
                <SquarePlus className="size-3.5" /> Add to Home Screen
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-[0.75rem] leading-snug text-muted">
              Opens full screen, works offline.
            </p>
          )}
        </div>
        {deferred ? (
          <Button size="sm" onClick={install}>
            Install
          </Button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="mmg-press grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-sand-light"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
