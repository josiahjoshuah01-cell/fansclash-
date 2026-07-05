import { AdminSidebar } from "@/components/admin-sidebar";
import { AppChrome } from "@/components/app-chrome";
import { requireAdmin } from "@/lib/admin-server";

async function getTeamNavCounts(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"]
) {
  const [{ count: approved }, { count: rejected }] = await Promise.all([
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("approved", true)
      .neq("competition", "Legacy"),
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("rejected", true)
      .neq("competition", "Legacy"),
  ]);

  return {
    approved: approved ?? 0,
    rejected: rejected ?? 0,
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase } = await requireAdmin();
  const teamCounts = await getTeamNavCounts(supabase);

  return (
    <AppChrome mainClassName="max-w-7xl pb-24 md:pb-10">
      <div
        className="flex flex-col gap-8 md:grid md:gap-8"
        style={{ gridTemplateColumns: "220px minmax(0, 1fr)" }}
      >
        <AdminSidebar initialTeamCounts={teamCounts} />
        <div className="min-w-0 space-y-8">{children}</div>
      </div>
    </AppChrome>
  );
}
