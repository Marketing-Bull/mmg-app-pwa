import { Compass } from "lucide-react";
import Link from "next/link";
import { AppBar } from "@/components/shell/app-bar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <AppBar title="Not found" />
      <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 pb-tabbar text-center">
        <span className="grid size-16 place-items-center rounded-full bg-sand-light">
          <Compass className="size-7 text-muted" />
        </span>
        <h1 className="mt-5 font-serif text-[1.7rem] leading-tight font-semibold tracking-[-0.04em]">
          Wrong room.
        </h1>
        <p className="mt-2.5 max-w-[22rem] text-[0.88rem] leading-relaxed text-muted text-pretty">
          That page doesn&rsquo;t exist. The events calendar is probably what you were after.
        </p>
        <div className="mt-5 flex gap-2.5">
          <Button asChild>
            <Link href="/events">See upcoming events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
