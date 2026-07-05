import { createBrowserClient } from "@supabase/ssr";

import { assertFansClashSupabaseUrl } from "@/lib/supabase/project";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  assertFansClashSupabaseUrl(url);

  return createBrowserClient(url!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
