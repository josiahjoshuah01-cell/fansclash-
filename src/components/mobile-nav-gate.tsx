import { MobileNav } from "@/components/mobile-nav";
import { getAdminAccess } from "@/lib/admin-server";

export async function MobileNavGate() {
  const { isAdmin } = await getAdminAccess();
  return <MobileNav showAdmin={isAdmin} />;
}
