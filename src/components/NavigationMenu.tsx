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

    if (!host || !apiKey) {
      console.warn("NavigationMenu not initialized: missing host or apiKey");
      return;
    }

    const app = createApp({
      apiKey,
      host,
      forceRedirect: true,
    });

    NavigationMenu.create(app, {
      items: [
        { label: "Add IP", destination: "https://be-search.biz/apps/bpp-20250814-final01/admin/add-ip" },
        { label: "Admin IPs", destination: "https://be-search.biz/apps/bpp-20250814-final01/admin/admin-ips" },
        { label: "Blocklist", destination: "https://be-search.biz/apps/bpp-20250814-final01/admin/blocklist" },
        { label: "List IP", destination: "https://be-search.biz/apps/bpp-20250814-final01/admin/list-ip" },
        { label: "Logs", destination: "https://be-search.biz/apps/bpp-20250814-final01/admin/logs" },
      ] as any,
    });
  }, []);

  return null;
}
