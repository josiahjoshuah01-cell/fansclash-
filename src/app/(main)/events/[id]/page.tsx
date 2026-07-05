import { notFound } from "next/navigation";

import { EventDetail } from "@/components/event-detail";
import { createClient } from "@/lib/supabase/server";
import type { SportingEvent } from "@/lib/events";

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: event } = await supabase
    .from("sporting_events")
    .select("id, team_a, team_b, kickoff_time, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance = 0;
  if (user) {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    balance = Number(wallet?.balance ?? 0);
  }

  return (
    <EventDetail
      event={event as SportingEvent}
      initialBalance={balance}
    />
  );
}
