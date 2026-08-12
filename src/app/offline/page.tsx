import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Offline",
  description: "You're offline.",
};

export default function OfflinePage() {
  return (
    <>
      <AppBar title="Offline" />
      <main className="pb-tabbar flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
        <span className="bg-sand-light grid size-16 place-items-center rounded-full">
          <WifiOff className="text-muted size-7" />
        </span>
        <h1 className="mt-5 font-serif text-[1.7rem] leading-tight font-semibold tracking-[-0.04em]">
          You&rsquo;re offline.
        </h1>
        <p className="text-muted mt-2.5 max-w-[22rem] text-[0.88rem] leading-relaxed text-pretty">
          Pages you&rsquo;ve already opened are still available. Reconnect to load the rest — or
          call MMG at {site.phone}.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </>
  );
}
