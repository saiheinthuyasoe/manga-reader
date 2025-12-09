"use client";

import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <AdminSidebar />
      {/* Desktop: ml-64 for sidebar, Mobile: no margin but pb-20 for bottom nav */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
