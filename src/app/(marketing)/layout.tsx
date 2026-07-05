import { LandingShell } from "@/components/landing/landing-shell";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LandingShell>{children}</LandingShell>;
}
