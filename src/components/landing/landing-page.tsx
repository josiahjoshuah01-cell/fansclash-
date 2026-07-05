import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { LandingHeroVisual } from "@/components/landing/landing-hero-visual";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <section className="grid min-w-0 items-start gap-4 pt-4 pb-10 sm:gap-6 sm:pt-5 sm:pb-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8 lg:pt-8 lg:pb-20 xl:grid-cols-[minmax(0,26rem)_minmax(0,1.15fr)] 2xl:grid-cols-[minmax(0,28rem)_minmax(0,1.25fr)]">
      <p className="order-1 px-5 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary sm:px-8 lg:hidden">
        Peer-to-peer fan pools
      </p>

      <LandingHeroVisual className="order-2 w-full min-w-0 px-4 sm:px-6 lg:order-2 lg:px-4 lg:pr-6 xl:pr-8" />

      <div className="order-3 mx-auto w-full max-w-lg px-5 text-center sm:px-8 lg:order-1 lg:mx-0 lg:max-w-none lg:justify-self-end lg:pl-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))] lg:pr-10 lg:text-left xl:pr-12">
        <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-primary lg:block">
          Peer-to-peer fan pools
        </p>

        <h1 className="text-[2.5rem] font-bold leading-[1.08] tracking-[-0.02em] sm:text-5xl lg:mt-4 lg:text-[3.25rem]">
          Bet against fans.
        </h1>

        <div className="mt-6 space-y-5 text-[15px] leading-[1.75] text-muted-foreground sm:text-base sm:leading-8">
          <p>
            Pick a fixture, choose the side you believe in, and stake from your
            wallet before kickoff. Add funds when you&apos;re ready.
          </p>
          <p>
            Your stake joins a fan pool until someone on the other side matches
            you — supporters backing opposite outcomes, with no bookmaker in the
            middle. When the final whistle blows, matched winning stakes share
            the pool.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
          <Button
            size="lg"
            className="h-12 min-w-[168px] rounded-full px-7 text-[15px] shadow-md shadow-primary/20"
            asChild
          >
            <Link href="/sign-in?mode=sign_up">
              Get started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 text-[15px] text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/how-it-works">How it works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
