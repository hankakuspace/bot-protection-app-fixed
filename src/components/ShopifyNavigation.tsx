// src/components/ShopifyNavigation.tsx
"use client";

import { useEffect } from "react";
import { useAppBridge } from "@/components/AppBridgeProvider";

export default function ShopifyNavigation() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    // Web Components API: Navigation Menu
    const navMenu = (window as any).shopify?.ui?.navMenu;
    if (navMenu) {
      navMenu({
        items: [
          { label: "IP追加", destination: "/admin/add-ip" },
          { label: "ブロックリスト一覧", destination: "/admin/list-ip" },
          { label: "アクセスログ", destination: "/admin/logs" },
        ],
      });
    } else {
      console.warn("⚠️ NavigationMenu API is not available (Admin Navigation Extension not enabled?)");
    }
  }, [app]);

  return null; // UIに直接描画はしない
}
