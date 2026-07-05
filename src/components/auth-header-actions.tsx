import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AuthHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-in?mode=sign_up">Sign up</Link>
      </Button>
    </div>
  );
}
