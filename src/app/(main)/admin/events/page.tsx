import { redirect } from "next/navigation";

import { CreateEventForm } from "@/components/create-event-form";
import { SettleEventsPanel } from "@/components/settle-events-panel";
import { isAdminPhone } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEventsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminPhone(user.phone)) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Admin · Events
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create scheduled matches for the open pool. MVP uses a hardcoded admin
          phone allowlist — replace with proper roles before launch.
        </p>
      </div>

      <CreateEventForm />
      <SettleEventsPanel />
    </div>
  );
}
