// src/components/NavigationMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Add IP", href: "/admin/add-ip" },
  { label: "Admin IPs", href: "/admin/admin-ips" },
  { label: "Blocklist", href: "/admin/blocklist" },
  { label: "List IP", href: "/admin/list-ip" },
  { label: "Logs", href: "/admin/logs" },
];

export default function AppNavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b border-gray-300 mb-4 p-3 bg-gray-50">
      {links.map((link) => {
        const active = pathname.includes(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
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
