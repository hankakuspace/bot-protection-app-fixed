// src/app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlusCircleIcon,
  ListBulletIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "ダッシュボード", href: "/admin/dashboard", icon: HomeIcon },
    { name: "IP追加", href: "/admin/add-ip", icon: PlusCircleIcon },
    { name: "IPリスト", href: "/admin/list-ip", icon: ListBulletIcon },
    { name: "アクセスログ", href: "/admin/logs", icon: ChartBarSquareIcon },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ✅ サイドバー */}
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-indigo-600">BOTガードMAN</h1>
          <p className="text-xs text-gray-500">管理画面</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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
      </aside>

      {/* ✅ メインコンテンツ */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
