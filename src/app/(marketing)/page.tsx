import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing/landing-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FansClash — P2P Fan Betting in Kenya",
  description:
    "Peer-to-peer fan betting with M-Pesa. Pick a side, stake KES, get matched with other fans, and settle at full time.",
  openGraph: {
    title: "FansClash — Bet against fans",
    description:
      "P2P fan betting in Kenya. Transparent pools, M-Pesa wallet, East Africa Time kickoffs.",
  },
};

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    redirect(wallet ? "/matches" : "/onboarding");
  }

  return <LandingPage />;
}
