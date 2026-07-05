import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "Terms of service — FansClash",
  description: "Terms governing use of the FansClash platform.",
};

export default function TermsPage() {
  return (
    <MarketingPage
      title="Terms of service"
      description="Please read these terms carefully before using FansClash."
    >
      <section className="space-y-4">
        <h2>1. Acceptance</h2>
        <p>
          By creating an account or using FansClash, you agree to these terms and
          our <Link href="/privacy">privacy policy</Link>. If you do not agree, do
          not use the service.
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Eligibility</h2>
        <ul>
          <li>You must be at least 18 years old.</li>
          <li>You must provide accurate registration and KYC information.</li>
          <li>
            You must not use FansClash where peer-to-peer staking is prohibited
            by applicable law.
          </li>
          <li>
            One account per person. We may suspend duplicate or fraudulent
            accounts.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>3. The service</h2>
        <p>
          FansClash operates peer-to-peer fan pools on sporting events. We
          facilitate matching, hold stakes in KES wallets, and settle outcomes
          based on official full-time results. We are not a traditional
          bookmaker setting odds against users.
        </p>
      </section>

      <section className="space-y-4">
        <h2>4. Wallet and payments</h2>
        <ul>
          <li>Deposits are processed via M-Pesa through our payment partners.</li>
          <li>
            Your verified M-Pesa number is set on first successful deposit and
            is used for compliance and payouts.
          </li>
          <li>
            Withdrawals, when available, are subject to verification, limits, and
            processing times shown in the app.
          </li>
          <li>
            We may delay or refuse transactions suspected of fraud or policy
            breach.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>5. Staking and settlement</h2>
        <ul>
          <li>Stakes must be placed before kickoff unless stated otherwise.</li>
          <li>Only matched stakes participate in settlement.</li>
          <li>
            Unmatched stakes are returned to your wallet if not paired before
            kickoff or as described in-app.
          </li>
          <li>
            Settlement uses the official result published for the event. Admin
            corrections may apply in case of postponement or data error.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>6. Prohibited conduct</h2>
        <p>You must not:</p>
        <ul>
          <li>Use multiple accounts or third-party accounts to circumvent limits.</li>
          <li>Attempt to manipulate pools, collude, or launder funds.</li>
          <li>Reverse-engineer, scrape, or disrupt the platform.</li>
          <li>Harass staff or other users.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>7. Suspension and termination</h2>
        <p>
          We may suspend or close accounts that violate these terms, applicable
          law, or our compliance requirements. You may close your account by
          contacting <Link href="/contact">support</Link>, subject to settlement
          of open stakes.
        </p>
      </section>

      <section className="space-y-4">
        <h2>8. Disclaimers</h2>
        <p>
          FansClash is provided &quot;as is.&quot; Staking involves risk of
          loss. We do not guarantee uninterrupted service. See our{" "}
          <Link href="/responsible-play">responsible play</Link> page for
          guidance.
        </p>
      </section>

      <section className="space-y-4">
        <h2>9. Changes</h2>
        <p>
          We may update these terms. Material changes will be posted on this
          page. Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section className="space-y-4">
        <h2>10. Contact</h2>
        <p>
          Questions about these terms: <Link href="/contact">Contact us</Link>.
        </p>
      </section>
    </MarketingPage>
  );
}
