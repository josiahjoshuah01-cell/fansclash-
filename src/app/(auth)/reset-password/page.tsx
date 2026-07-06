import type { Metadata } from "next";

import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — FansClash",
  description: "Choose a new password for your FansClash account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
