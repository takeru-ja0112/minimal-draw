"use client";

import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { usePathname } from "next/navigation";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="relative z-10 min-h-screen w-full">{children}</div>;
  }

  return (
    <>
      <div className="relative z-10 min-h-screen w-full">
        {/* <BgObject /> */}
        <Header />
        <div className="pt-14">{children}</div>
        <footer className="text-center p-4 text-gray-500 text-sm">
        </footer>
        <Footer />
      </div>
    </>
  );
}
