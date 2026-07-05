import { TopNav } from "@/components/top-nav";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
