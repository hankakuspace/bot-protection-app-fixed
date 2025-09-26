// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";
import { useAppBridge } from "@/components/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function NavMenu() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    // ✅ NavigationMenu に links を渡す
    const navMenu = NavigationMenu.create(app, {
      links: [
        { label: "ダッシュボード", destination: "/admin/dashboard" },
        { label: "アクセスログ", destination: "/admin/logs" },
        { label: "管理者設定", destination: "/admin/admin-ip" },
        { label: "ブロック設定", destination: "/admin/block-ip" },
      ],
    });

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null; // HTMLには出さない
}
