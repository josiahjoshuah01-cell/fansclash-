import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet — FansClash",
  description: "Top up with M-Pesa and track your betting balance.",
};

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
