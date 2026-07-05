import Image from "next/image";

import { cn } from "@/lib/utils";

export function LandingHeroVisual({ className }: { className?: string }) {
  return (
    <figure
      className={cn("relative w-full min-w-0 lg:w-full", className)}
      aria-label="Two passionate football fans facing off"
    >
      <div
        aria-hidden
        className="absolute -inset-2 hidden rounded-2xl bg-primary/10 blur-2xl sm:-inset-3 sm:block dark:bg-primary/5"
      />
      <div className="relative mx-auto aspect-[3/2] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 sm:rounded-2xl sm:ring-border/60 lg:mx-0 lg:h-[min(calc(100dvh-7rem),36rem)] lg:w-full lg:max-w-none lg:rounded-2xl lg:ring-border/60 xl:h-[min(calc(100dvh-7rem),40rem)] 2xl:h-[min(calc(100dvh-7rem),44rem)]">
        <Image
          src="/images/landing-fans-clash-hero.png"
          alt="Two football fans shouting across the divide — home supporters on the left, away supporters on the right"
          fill
          priority
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 62vw"
          className="object-cover object-[center_42%] lg:object-center"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent lg:from-black/20"
        />
      </div>
    </figure>
  );
}
