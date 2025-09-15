// src/app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarSquareIcon,
  PlusCircleIcon,
  ListBulletIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 展開中メニュー
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // ページ遷移時に該当メニューを自動展開
  useEffect(() => {
    if (pathname.startsWith("/admin/add-")) {
      setOpenMenus((prev) => ({ ...prev, ["IP追加"]: true }));
    }
    if (pathname.startsWith("/admin/list-")) {
      setOpenMenus((prev) => ({ ...prev, ["IPリスト"]: true }));
    }
  }, [pathname]);

  const navGroups = [
    {
      title: null,
      items: [
        { name: "ダッシュボード", href: "/admin/dashboard", icon: HomeIcon },
        { name: "アクセスログ", href: "/admin/logs", icon: ChartBarSquareIcon },
      ],
    },
    {
      title: "IP追加",
      icon: PlusCircleIcon,
      children: [
        { name: "管理者", href: "/admin/add-admin-ip" },
        { name: "ブロック", href: "/admin/add-ip" },
      ],
    },
    {
      title: "IPリスト",
      icon: ListBulletIcon,
      children: [
        { name: "管理者", href: "/admin/list-admin-ip" },
        { name: "ブロック", href: "/admin/list-ip" },
      ],
    },
    {
      title: null,
      items: [
        { name: "ブロック設定", href: "/admin/blocked", icon: ShieldCheckIcon },
      ],
    },
  ];

  const renderNav = (closeSidebar?: () => void) => (
    <nav className="p-4 space-y-4 flex-1">
      {navGroups.map((group, idx) => (
        <div key={idx}>
          {/* 単独メニュー */}
          {group.items &&
            group.items.map((item) => {
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

          {/* グループメニュー */}
          {group.title && (
            <div>
              {(() => {
                const childActive = group.children?.some(
                  (c) => pathname === c.href
                );
                const isActive = !!childActive;

                return (
                  <button
                    onClick={() => toggleMenu(group.title!)}
                    className={`flex items-center gap-2 px-4 py-2 w-full font-semibold rounded-md transition ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {group.icon && <group.icon className="h-5 w-5" />}
                    {group.title}
                  </button>
                );
              })()}

              {openMenus[group.title] && (
                <ul className="ml-10 mt-1 space-y-1">
                  {group.children?.map((child) => {
                    const active = pathname === child.href;
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => closeSidebar && closeSidebar()}
                          className={`block px-2 py-1 rounded-md text-sm transition ${
                            active
                              ? "text-indigo-600 font-semibold"
                              : "text-gray-700 hover:text-gray-900"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
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

      {/* サイドバー（モバイル） */}
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
