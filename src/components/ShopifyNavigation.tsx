// src/components/ShopifyNavigation.tsx
"use client";

import { useEffect } from "react";
import { NavigationMenu } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@/components/AppBridgeProvider";

export default function ShopifyNavigation() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    const items = [
      { label: "IP追加", destination: "/add-ip" },
      { label: "ブロックリスト一覧", destination: "/list-ip" },
      { label: "アクセスログ", destination: "/logs" },
    ] as any; // ✅ 型エラー回避

    const navMenu = NavigationMenu.create(app, { items });

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
