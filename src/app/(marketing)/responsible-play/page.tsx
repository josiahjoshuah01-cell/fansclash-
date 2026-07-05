import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "Responsible play — FansClash",
  description: "Guidelines for safe, informed staking on FansClash.",
};

export default function ResponsiblePlayPage() {
  return (
    <MarketingPage
      title="Responsible play"
      description="FansClash is entertainment with real money at stake. Play within your means."
    >
      <section className="space-y-4">
        <h2>18+ only</h2>
        <p>
          FansClash is strictly for adults aged 18 and over. We verify age during
          onboarding and may close accounts that fail verification.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Stake what you can afford to lose</h2>
        <p>
          Peer-to-peer staking still carries risk. Only use disposable income —
          never money needed for rent, food, school fees, or debt repayments.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Understand the product</h2>
        <ul>
          <li>You are matched against other fans, not guaranteed a return.</li>
          <li>Only matched stakes settle; unmatched stakes may be refunded.</li>
          <li>Past results do not predict future outcomes.</li>
        </ul>
        <p>
          Read <Link href="/how-it-works">How it works</Link> before your first
          stake.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Warning signs</h2>
        <p>Consider taking a break if you:</p>
        <ul>
          <li>Chase losses with larger stakes.</li>
          <li>Hide staking from family or friends.</li>
          <li>Feel anxious or irritable when not staking.</li>
          <li>Borrow money to fund your wallet.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Self-exclusion and limits</h2>
        <p>
          Contact us via the <Link href="/contact">contact page</Link> to request
          account suspension or self-exclusion. We will action verified requests
          and explain any open stake or wallet balance implications.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Support resources</h2>
        <p>
          If you or someone you know needs help with gambling-related harm, reach
          out to a qualified counsellor or local support organisation. In Kenya,
          organisations such as{" "}
          <a
            href="https://www.gamblersanonymous.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gamblers Anonymous
          </a>{" "}
          offer peer support internationally.
        </p>
      </section>
    </MarketingPage>
  );
}
