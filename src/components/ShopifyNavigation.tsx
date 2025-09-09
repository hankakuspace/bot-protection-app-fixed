// src/components/ShopifyNavigation.tsx
"use client";

import { useEffect } from "react";
import { NavigationMenu } from "@shopify/app-bridge/actions";
import type { NavigationMenuProps } from "@shopify/app-bridge/actions/NavigationMenu";
import { useAppBridge } from "@/components/AppBridgeProvider";

export default function ShopifyNavigation() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    const items: NavigationMenuProps["items"] = [
      { label: "IP追加", destination: "/admin/add-ip" },
      { label: "ブロックリスト一覧", destination: "/admin/list-ip" },
      { label: "アクセスログ", destination: "/admin/logs" },
    ];

    const navMenu = NavigationMenu.create(app, { items });

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
