"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  History,
  ShoppingBag,
  Settings,
  Home,
  BookPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Manage Manga",
    href: "/admin/manga",
    icon: BookOpen,
  },
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: History,
    adminOnly: true,
  },
  {
    label: "Purchases",
    href: "/admin/purchases",
    icon: ShoppingBag,
    adminOnly: true,
  },
  {
    label: "Manga Requests",
    href: "/admin/manga-requests",
    icon: BookPlus,
    adminOnly: true,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen fixed left-0 top-16 pt-6 pb-6 overflow-y-auto">
        {/* Back to Home */}
        <div className="px-4 mb-6">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-zinc-800 mt-6 mb-6 mx-4" />

        {/* Settings */}
        <div className="px-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 transition ${
                  isActive ? "text-green-500" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs truncate w-full text-center">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
