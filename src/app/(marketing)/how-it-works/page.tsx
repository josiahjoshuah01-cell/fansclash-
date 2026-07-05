import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "How it works — FansClash",
  description: "How P2P fan pools, M-Pesa deposits, and settlement work on FansClash.",
};

export default function HowItWorksPage() {
  return (
    <MarketingPage
      title="How it works"
      description="From account creation to payout — the full FansClash flow."
    >
      <section className="space-y-4">
        <h2>1. Create your account</h2>
        <p>
          Sign up with email or Google. Complete onboarding with your date of
          birth and compliance details. You must be 18+ to use FansClash.
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Fund your wallet</h2>
        <p>
          Add KES via M-Pesa STK Push. On your first successful deposit, your
          verified M-Pesa number is recorded and cannot be changed manually —
          this keeps payouts tied to the number that paid in.
        </p>
      </section>

      <section className="space-y-4">
        <h2>3. Pick a match and a side</h2>
        <p>
          Browse open fixtures on the match board. Each event shows two fan pools
          (home vs away). Choose the side you want to back and enter your stake
          amount before kickoff.
        </p>
      </section>

      <section className="space-y-4">
        <h2>4. Get matched peer-to-peer</h2>
        <p>
          Your stake enters the pool on your chosen side. It stays{" "}
          <strong className="text-foreground">unmatched</strong> until a fan on
          the opposite side stakes enough to pair with you. Only matched stakes
          count toward settlement.
        </p>
      </section>

      <section className="space-y-4">
        <h2>5. Settlement at full time</h2>
        <p>
          When the fixture ends, winning-side matched stakes share the total
          matched pool proportionally (minus any platform fee disclosed at stake
          time). Losing-side matched stakes receive nothing. Unmatched stakes are
          refunded to your wallet.
        </p>
      </section>

      <section className="space-y-4">
        <h2>6. Withdrawals</h2>
        <p>
          Withdrawals to M-Pesa may be offered when enabled in your region and
          subject to verification. Check the wallet page for current availability.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Ready to start?</h2>
        <p>
          <Link href="/sign-in?mode=sign_up">Create a free account</Link> or read
          our <Link href="/responsible-play">responsible play</Link> guidelines
          before you stake.
        </p>
      </section>
    </MarketingPage>
  );
}
