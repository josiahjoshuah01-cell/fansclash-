"use client";

import { useEffect } from "react";

import {
  completeAuthRedirect,
  hasAuthRedirectTokens,
} from "@/lib/auth/complete-auth-redirect";
import { createClient } from "@/lib/supabase/client";

export function AuthHashHandler() {
  useEffect(() => {
    if (!hasAuthRedirectTokens()) return;

    const { pathname, search, hash } = window.location;

    if (pathname !== "/auth/confirm") {
      window.location.replace(`/auth/confirm${search}${hash}`);
      return;
    }

    const supabase = createClient();

    void completeAuthRedirect(supabase).then(({ destination, error }) => {
      if (error) return;
      window.location.assign(destination);
    });
  }, []);

  return null;
}
