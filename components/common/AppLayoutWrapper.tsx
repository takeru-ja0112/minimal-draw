"use client";

import { usePathname } from "next/navigation";
import BgObject from "@/components/organisms/BgObject";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <>
      <BgObject />
      <Header />
      <div className="pt-14">{children}</div>
      <footer className="text-center p-4 text-gray-500 text-sm">
      </footer>
      <Footer />
    </>
  );
}
