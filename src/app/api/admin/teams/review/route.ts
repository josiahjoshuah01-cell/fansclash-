import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

type ReviewBody = {
  external_id: string;
  name: string;
  competition: string;
  logo_url?: string | null;
  action: "approve" | "reject";
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await isAdminUser(supabase, user.id, {
    phone: user.phone,
    email: user.email,
  });

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: ReviewBody;
  try {
    body = (await request.json()) as ReviewBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.external_id || !body.name || !body.competition || !body.action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("admin_review_team", {
    p_external_id: body.external_id,
    p_name: body.name,
    p_competition: body.competition,
    p_logo_url: body.logo_url ?? null,
    p_approved: body.action === "approve",
  });

  if (error) {
    const hint =
      error.message.includes("admin_review_team") ||
      error.message.includes("Could not find the function")
        ? " Run the latest database migration."
        : "";

    return NextResponse.json({ error: error.message + hint }, { status: 500 });
  }

  return NextResponse.json({ team: data });
}
