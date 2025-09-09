// src/components/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/add-ip", label: "IP追加" },
    { href: "/admin/list-ip", label: "ブロックリスト" },
    { href: "/admin/logs", label: "アクセスログ" },
  ];

  return (
    <nav className="mb-6 border-b border-gray-200">
      <ul className="flex space-x-6">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`pb-2 ${
                pathname === link.href
                  ? "border-b-2 border-blue-500 font-semibold"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
