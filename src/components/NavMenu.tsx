// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";
import { useAppBridge } from "@/components/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function NavMenu() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    const navMenu = NavigationMenu.create(app, {
      items: [
        NavigationMenu.Item.create(app, {
          label: "ダッシュボード",
          destination: "/admin/dashboard",
        }),
        NavigationMenu.Item.create(app, {
          label: "アクセスログ",
          destination: "/admin/logs",
        }),
        NavigationMenu.Item.create(app, {
          label: "管理者設定",
          destination: "/admin/admin-ip",
        }),
        NavigationMenu.Item.create(app, {
          label: "ブロック設定",
          destination: "/admin/block-ip",
        }),
      ],
    });

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
