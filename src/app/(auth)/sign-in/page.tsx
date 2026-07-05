import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { SignInForm } from "./sign-in-form";

function SignInSkeleton() {
  return (
    <div className="w-full space-y-6 rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-12 rounded-2xl" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}
