// src/components/NavigationMenu.tsx
"use client";

import { useEffect } from "react";
import createApp from "@shopify/app-bridge";
import { Redirect } from "@shopify/app-bridge/actions";
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

  const app = typeof window !== "undefined"
    ? createApp({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host: searchParams.get("host") || "",
        forceRedirect: true,
      })
    : null;

  const redirect = app ? Redirect.create(app) : null;

  return (
    <nav className="flex gap-4 border-b border-gray-300 mb-4 p-3 bg-gray-50">
      {links.map((link) => {
        const href = `${link.path}${suffix}`;
        const active = pathname.includes(link.path);

        return (
          <button
            key={link.path}
            onClick={() => {
              if (redirect) {
                // ✅ ADMIN_PATH を使って遷移（ループ防止）
                redirect.dispatch(Redirect.Action.ADMIN_PATH, link.path + suffix);
              } else {
                window.location.href = href;
              }
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              active ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-100"
            }`}
          >
            {link.label}
          </button>
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
