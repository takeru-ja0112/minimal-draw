import AdminSidebar from "@/components/admin/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minimal Draw | Admin Panel",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans flex flex-col lg:flex-row antialiased w-full">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        <div className="p-4 md:p-8 flex-1 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
