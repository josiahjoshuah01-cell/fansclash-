import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "Privacy policy — FansClash",
  description: "How FansClash collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      title="Privacy policy"
      description="How we handle your information when you use FansClash."
    >
      <section className="space-y-4">
        <h2>1. Who we are</h2>
        <p>
          FansClash (&quot;we&quot;, &quot;us&quot;) operates a peer-to-peer fan
          betting platform in Kenya. This policy explains what data we collect and
          why.
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Data we collect</h2>
        <ul>
          <li>
            <strong className="text-foreground">Account data</strong> — email,
            authentication identifiers, date of birth, onboarding details.
          </li>
          <li>
            <strong className="text-foreground">Phone / M-Pesa</strong> — MSISDN
            verified on first successful deposit; used for payments and
            compliance.
          </li>
          <li>
            <strong className="text-foreground">Transaction data</strong> —
            deposits, stakes, settlements, withdrawals, wallet balances.
          </li>
          <li>
            <strong className="text-foreground">Usage data</strong> — device,
            browser, IP address, and app interactions for security and
            improvement.
          </li>
          <li>
            <strong className="text-foreground">KYC / compliance</strong> —
            verification status and flags required by law or risk policy.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>3. How we use data</h2>
        <ul>
          <li>Provide and secure the service (auth, wallets, matching, settlement).</li>
          <li>Process M-Pesa deposits and withdrawals via payment partners.</li>
          <li>Meet legal, tax, and anti-fraud obligations.</li>
          <li>Communicate service updates and support responses.</li>
          <li>Improve reliability and detect abuse.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>4. Sharing</h2>
        <p>We may share data with:</p>
        <ul>
          <li>Supabase (hosting and authentication infrastructure).</li>
          <li>Safaricom / Daraja (M-Pesa payment processing).</li>
          <li>Email and analytics providers bound by confidentiality.</li>
          <li>Regulators or law enforcement when legally required.</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </section>

      <section className="space-y-4">
        <h2>5. Retention</h2>
        <p>
          We retain account and transaction records as long as needed to operate
          the service, resolve disputes, and comply with legal retention
          requirements.
        </p>
      </section>

      <section className="space-y-4">
        <h2>6. Security</h2>
        <p>
          We use industry-standard measures including encrypted transport (HTTPS),
          row-level database access controls, and server-side validation of
          financial operations. No system is 100% secure — report suspected
          breaches via <Link href="/contact">contact</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2>7. Your rights</h2>
        <p>
          Depending on applicable law, you may request access, correction, or
          deletion of personal data. Some data cannot be deleted while stakes are
          open or law requires retention. Contact us to submit a request.
        </p>
      </section>

      <section className="space-y-4">
        <h2>8. Cookies</h2>
        <p>
          We use essential cookies for authentication sessions. Theme preference
          may be stored locally in your browser.
        </p>
      </section>

      <section className="space-y-4">
        <h2>9. Changes</h2>
        <p>
          We will post updates on this page. Significant changes may be notified
          by email or in-app notice.
        </p>
      </section>

      <section className="space-y-4">
        <h2>10. Contact</h2>
        <p>
          Privacy questions: <Link href="/contact">Contact us</Link>.
        </p>
      </section>
    </MarketingPage>
  );
}
