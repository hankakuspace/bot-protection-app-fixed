// src/components/NavigationMenu.tsx
"use client";

import { useEffect } from "react";
import createApp from "@shopify/app-bridge";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function AppNavigationMenu() {
  useEffect(() => {
    // ✅ host は Shopify から ?host=xxxx として渡される
    const host = new URLSearchParams(window.location.search).get("host") || "";

    const app = createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    });

    const navMenu = NavigationMenu.create(app, {
      items: [
        { label: "Add IP", destination: "/admin/add-ip" },
        { label: "Admin IPs", destination: "/admin/admin-ips" },
        { label: "Blocklist", destination: "/admin/blocklist" },
        { label: "List IP", destination: "/admin/list-ip" },
        { label: "Logs", destination: "/admin/logs" },
      ],
    });

    return () => {
      navMenu.unsubscribe();
    };
  }, []);

  return null; // Shopify が自動で左メニューを描画するため UIは不要
}
