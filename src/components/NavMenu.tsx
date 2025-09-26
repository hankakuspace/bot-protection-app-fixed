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
      // ✅ 型エラーを回避するために as any
      items: [
        { label: "ダッシュボード", destination: "/admin/dashboard" } as any,
        { label: "アクセスログ", destination: "/admin/logs" } as any,
        { label: "管理者設定", destination: "/admin/admin-ip" } as any,
        { label: "ブロック設定", destination: "/admin/block-ip" } as any,
      ],
    });

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
