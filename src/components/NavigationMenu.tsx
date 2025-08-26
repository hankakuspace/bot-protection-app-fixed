// src/components/NavigationMenu.tsx
"use client";

import { useEffect } from "react";
import createApp from "@shopify/app-bridge";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function AppNavigationMenu() {
  useEffect(() => {
    const host = new URLSearchParams(window.location.search).get("host") || "";

    const app = createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    });

    const navMenu = NavigationMenu.create(app, {
      items: [
        NavigationMenu.Link.create(app, {
          label: "Add IP",
          destination: "/admin/add-ip",
        }),
        NavigationMenu.Link.create(app, {
          label: "Admin IPs",
          destination: "/admin/admin-ips",
        }),
        NavigationMenu.Link.create(app, {
          label: "Blocklist",
          destination: "/admin/blocklist",
        }),
        NavigationMenu.Link.create(app, {
          label: "List IP",
          destination: "/admin/list-ip",
        }),
        NavigationMenu.Link.create(app, {
          label: "Logs",
          destination: "/admin/logs",
        }),
      ],
    });

    return () => {
      navMenu.unsubscribe();
    };
  }, []);

  return null;
}
