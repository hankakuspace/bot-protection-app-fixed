// src/components/ShopifyNavigation.tsx
"use client";

import { useEffect } from "react";
import { NavigationMenu } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@/components/AppBridgeProvider";

export default function ShopifyNavigation() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    const navMenu = NavigationMenu.create(app, {
      items: [
        { label: "IP追加", destination: { url: "/admin/add-ip" } },
        { label: "ブロックリスト一覧", destination: { url: "/admin/list-ip" } },
        { label: "アクセスログ", destination: { url: "/admin/logs" } },
      ],
    });

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
