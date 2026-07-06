import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password — FansClash",
  description: "Reset your FansClash account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
