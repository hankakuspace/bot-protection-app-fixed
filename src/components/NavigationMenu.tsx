// src/components/NavigationMenu.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const links = [
  { label: "Add IP", path: "/apps/bpp-20250814-final01/admin/add-ip" },
  { label: "Admin IPs", path: "/apps/bpp-20250814-final01/admin/admin-ips" },
  { label: "Blocklist", path: "/apps/bpp-20250814-final01/admin/blocklist" },
  { label: "List IP", path: "/apps/bpp-20250814-final01/admin/list-ip" },
  { label: "Logs", path: "/apps/bpp-20250814-final01/admin/logs" },
];

function MenuInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const suffix = queryString ? `?${queryString}` : "";

  return (
    <nav className="flex gap-4 border-b border-gray-300 mb-4 p-3 bg-gray-50">
      {links.map((link) => {
        const href = `${link.path}${suffix}`;
        const active = pathname.includes(link.path);
        return (
          <Link
            key={link.path}
            href={href}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              active ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppNavigationMenu() {
  return (
    <Suspense fallback={null}>
      <MenuInner />
    </Suspense>
  );
}
