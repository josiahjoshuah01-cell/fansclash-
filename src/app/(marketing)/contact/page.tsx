import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "Contact — FansClash",
  description: "Get in touch with the FansClash team.",
};

export default function ContactPage() {
  return (
    <MarketingPage
      title="Contact"
      description="Support, compliance, and general enquiries."
    >
      <section className="space-y-4">
        <h2>Support</h2>
        <p>
          For account, wallet, or staking issues, email us at{" "}
          <a href="mailto:support@fansclash.com">support@fansclash.com</a>.
          Include your registered email and a short description of the issue.
        </p>
        <p>
          We aim to respond within two business days (EAT, Mon–Fri).
        </p>
      </section>

      <section className="space-y-4">
        <h2>Compliance &amp; privacy</h2>
        <p>
          For KYC, data, or legal requests:{" "}
          <a href="mailto:compliance@fansclash.com">
            compliance@fansclash.com
          </a>
          . See our <Link href="/privacy">privacy policy</Link> for data rights.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Responsible play</h2>
        <p>
          To request self-exclusion or report concerning account activity, use the
          compliance address above or read{" "}
          <Link href="/responsible-play">Responsible play</Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Before you write</h2>
        <ul>
          <li>
            Check <Link href="/how-it-works">How it works</Link> for staking and
            settlement questions.
          </li>
          <li>
            M-Pesa deposit delays can take a few minutes — wait for the STK
            callback before contacting support.
          </li>
          <li>Never share your password or M-Pesa PIN with anyone, including us.</li>
        </ul>
      </section>
    </MarketingPage>
  );
}
