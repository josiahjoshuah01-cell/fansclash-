import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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
      <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
        Verified
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        Verification pending
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
        Verification rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      Not verified
    </span>
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
        .select("phone_number, date_of_birth, kyc_status, created_at")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const phone = profile?.phone_number ?? user?.phone ?? "—";
  const dateOfBirth = profile?.date_of_birth ?? null;
  const memberSince = profile?.created_at ?? user?.created_at ?? null;
  const kycStatus = profile?.kyc_status ?? "none";

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your account details and verification status.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{phone}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Date of birth</p>
            <p className="font-medium">
              {dateOfBirth ? formatDateOfBirth(dateOfBirth) : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Member since</p>
            <p className="font-medium">
              {memberSince ? formatMemberSince(memberSince) : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">KYC status</p>
            <p className={cn("mt-1")}>
              <KycBadge status={kycStatus} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
