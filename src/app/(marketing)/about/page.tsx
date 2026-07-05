import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "About — FansClash",
  description: "What FansClash is and who we built it for.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      title="About FansClash"
      description="Peer-to-peer fan betting built for Kenyan football supporters."
    >
      <section className="space-y-4">
        <h2>Our mission</h2>
        <p>
          FansClash lets supporters stake on match outcomes against each other —
          not against a bookmaker. Pools are transparent, stakes are in KES, and
          settlement follows the full-time result of the fixture.
        </p>
        <p>
          We built FansClash for fans who want a simple, social way to back their
          team with real skin in the game, using payment rails they already trust.
        </p>
      </section>

      <section className="space-y-4">
        <h2>What makes us different</h2>
        <ul>
          <li>
            <strong className="text-foreground">Peer-to-peer pools</strong> —
            matched stakes from fans on each side, not house odds.
          </li>
          <li>
            <strong className="text-foreground">M-Pesa-first wallet</strong> —
            top up via STK Push; your verified number is set on first deposit.
          </li>
          <li>
            <strong className="text-foreground">Kenya-native UX</strong> —
            kickoffs and balances shown in East Africa Time (EAT).
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Who can use FansClash</h2>
        <p>
          You must be 18 or older and complete account onboarding before placing
          stakes. We verify identity details as part of our compliance process
          and may restrict accounts that breach our{" "}
          <Link href="/terms">terms</Link> or{" "}
          <Link href="/responsible-play">responsible play</Link> guidelines.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Questions</h2>
        <p>
          Reach us via the <Link href="/contact">contact page</Link>. For how
          staking and settlement work, see{" "}
          <Link href="/how-it-works">How it works</Link>.
        </p>
      </section>
    </MarketingPage>
  );
}
