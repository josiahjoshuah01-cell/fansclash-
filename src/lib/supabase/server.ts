import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertFansClashSupabaseUrl } from "@/lib/supabase/project";

export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  assertFansClashSupabaseUrl(url);

  return createServerClient(
    url!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore when
            // middleware handles session refresh (Prompt 4).
          }
        },
      },
    }
  );
}
