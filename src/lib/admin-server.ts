import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    !(await isAdminUser(supabase, user.id, {
      phone: user.phone,
      email: user.email,
    }))
  ) {
    redirect("/matches");
  }

  return { supabase, user };
}

export async function getAdminAccess() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false as const, user: null };
  }

  const isAdmin = await isAdminUser(supabase, user.id, {
    phone: user.phone,
    email: user.email,
  });

  return { isAdmin, user };
}
