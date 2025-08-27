// src/components/NavigationMenu.tsx
"use client";

import { useEffect } from "react";
import createApp from "@shopify/app-bridge";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function AppNavigationMenu() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host") || "";
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";

    console.log("🚀 NavigationMenu init check", { host, apiKey });

    if (!host || !apiKey) {
      console.warn("⏭ NavigationMenu skipped (missing host/apiKey)", { host, apiKey });
      return;
    }

    try {
      const app = createApp({
        apiKey,
        host,
        forceRedirect: true,
      });

      // Navigation links
      const items = [
        { label: "Add IP", destination: "/apps/bpp-20250814-final01/admin/add-ip" },
        { label: "Admin IPs", destination: "/apps/bpp-20250814-final01/admin/admin-ips" },
        { label: "Blocklist", destination: "/apps/bpp-20250814-final01/admin/blocklist" },
        { label: "List IP", destination: "/apps/bpp-20250814-final01/admin/list-ip" },
        { label: "Logs", destination: "/apps/bpp-20250814-final01/admin/logs" },
      ];

      const currentPath = window.location.pathname;
      const activeItem = items.find((i) => currentPath.includes(i.destination));

      // ✅ 型を AppLink[] にキャストして回避
      NavigationMenu.create(app, {
        items: items as any,
        active: activeItem as any,
      });

      console.log("✅ NavigationMenu created", { activeItem });
    } catch (err) {
      console.error("❌ NavigationMenu init error", err);
    }
  }, []);

  return null;
}
