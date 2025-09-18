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
  TrashIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "ダッシュボード", href: "/admin/dashboard", icon: HomeIcon },
    { name: "アクセスログ", href: "/admin/logs", icon: ChartBarSquareIcon },
    { name: "管理者設定", href: "/admin/admin-ip", icon: UserCircleIcon },
    { name: "ブロック設定", href: "/admin/block-ip", icon: ShieldExclamationIcon },
  ];

  const renderNav = (closeSidebar?: () => void) => (
    <nav className="p-4 space-y-2 flex-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => closeSidebar && closeSidebar()}
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium transition ${
              active
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* モバイル用ハンバーガー */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 flex items-center p-2 rounded-md border bg-white shadow-sm"
        onClick={() => setSidebarOpen(true)}
      >
        <Bars3Icon className="h-6 w-6 text-gray-700" />
      </button>

      {/* サイドバー（デスクトップ） */}
      <aside className="hidden md:flex md:w-64 shrink-0 bg-white border-r shadow-sm flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-indigo-600">BOTガードMAN</h1>
          <p className="text-xs text-gray-500">管理画面</p>
        </div>
        {renderNav()}
      </aside>

      {/* サイドバー（モバイルスライドイン） */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white shadow-lg flex flex-col z-50">
            <div className="flex items-center justify-between p-6 border-b">
              <h1 className="text-lg font-bold text-indigo-600">BOTガードMAN</h1>
              <button
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-gray-700" />
              </button>
            </div>
            {renderNav(() => setSidebarOpen(false))}
          </aside>
        </div>
      )}

      {/* メイン */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
