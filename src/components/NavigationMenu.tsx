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

    // ✅ host や apiKey が無ければ初期化しない
    if (!host || !apiKey) {
      console.warn("Skip AppBridge init: missing host or apiKey");
      return;
    }

    try {
      const app = createApp({
        apiKey,
        host,
        forceRedirect: true,
      });

      NavigationMenu.create(app, {
        items: [
          { label: "Add IP", destination: "/admin/add-ip" },
          { label: "Admin IPs", destination: "/admin/admin-ips" },
          { label: "Blocklist", destination: "/admin/blocklist" },
          { label: "List IP", destination: "/admin/list-ip" },
          { label: "Logs", destination: "/admin/logs" },
        ] as any,
      });
    } catch (err) {
      console.error("AppBridge init error", err);
    }
  }, []);

  return null;
}
