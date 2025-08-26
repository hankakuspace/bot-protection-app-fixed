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
      console.warn("⏭ NavigationMenu skipped (missing host/apiKey)");
      return;
    }

    try {
      const app = createApp({
        apiKey,
        host,
        forceRedirect: true,
      });

      // ✅ NavigationMenu 設定（active を明示）
      NavigationMenu.create(app, {
        items: [
          { label: "Add IP", destination: "/apps/bpp-20250814-final01/admin/add-ip" },
          { label: "Admin IPs", destination: "/apps/bpp-20250814-final01/admin/admin-ips" },
          { label: "Blocklist", destination: "/apps/bpp-20250814-final01/admin/blocklist" },
          { label: "List IP", destination: "/apps/bpp-20250814-final01/admin/list-ip" },
          { label: "Logs", destination: "/apps/bpp-20250814-final01/admin/logs" },
        ] as any,
        active: "/apps/bpp-20250814-final01/admin/logs",
      });
    } catch (err) {
      console.error("NavigationMenu init error", err);
    }
  }, []);

  return null;
}
