// src/app/admin/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarSquareIcon,
  UserCircleIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "ダッシュボード", href: "/admin/dashboard", icon: HomeIcon },
    { name: "アクセスログ", href: "/admin/logs", icon: ChartBarSquareIcon },
    { name: "管理者IP", href: "/admin/admin-ip", icon: UserCircleIcon },
    { name: "ブロック設定", href: "/admin/block-ip", icon: ShieldExclamationIcon },
    { name: "許可設定", href: "/admin/allow-ip", icon: ShieldCheckIcon },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* サイドバー */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r shadow-sm">
        <div className="p-4 text-lg font-bold">Bot Guard MAN</div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                  active
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* モバイル用 */}
      <div className="md:hidden">
        <button
          className="p-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
        )}
        {sidebarOpen && (
          <aside className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 p-4">
            <div className="text-lg font-bold mb-4">Bot Guard MAN</div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                      active
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}
      </div>

      {/* メイン */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
