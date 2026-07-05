import type { Metadata } from "next";
import Link from "next/link";

import { PageContent } from "@/components/layout/page-content";
import { Panel } from "@/components/layout/panel";
import { SignOutButton } from "@/components/sign-out-button";
import { formatVerifiedMsisdn } from "@/lib/phone-display";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile — FansClash",
  description: "Your account details and verification status.",
};

function formatMemberSince(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateOfBirth(date: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function KycBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        Verified
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Verification pending
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
        Verification rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Not verified
    </span>
  );
}

function ProfileRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="min-w-0 text-right text-sm font-medium">{children}</div>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("phone_number, date_of_birth, kyc_status, created_at, is_admin")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const phone = formatVerifiedMsisdn(profile?.phone_number);
  const dateOfBirth = profile?.date_of_birth ?? null;
  const memberSince = profile?.created_at ?? user?.created_at ?? null;
  const kycStatus = profile?.kyc_status ?? "none";
  const isAdmin = Boolean(profile?.is_admin);
  const email = user?.email ?? "—";

  return (
    <PageContent className="mx-auto max-w-2xl space-y-3">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account details and verification status.
        </p>
      </div>

      <Panel
        compact
        title="Account"
        description="M-Pesa number is set by your first successful deposit."
        contentClassName="divide-y divide-border p-0"
      >
        <ProfileRow label="Email">
          <span className="truncate">{email}</span>
        </ProfileRow>
        <ProfileRow label="Phone">
          <span className="text-muted-foreground">{phone}</span>
        </ProfileRow>
        <ProfileRow label="Date of birth">
          {dateOfBirth ? formatDateOfBirth(dateOfBirth) : "—"}
        </ProfileRow>
        <ProfileRow label="Member since">
          {memberSince ? formatMemberSince(memberSince) : "—"}
        </ProfileRow>
        <ProfileRow label="KYC status">
          <KycBadge status={kycStatus} />
        </ProfileRow>
        {isAdmin ? (
          <ProfileRow label="Role">
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            >
              Admin dashboard →
            </Link>
          </ProfileRow>
        ) : null}

        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Sign out on shared or public devices.
          </p>
          <SignOutButton className="w-full shrink-0 sm:w-auto" size="sm" />
        </div>
      </Panel>
    </PageContent>
  );
}
