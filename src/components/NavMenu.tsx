// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function NavMenu() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) return;

    const navMenu = (NavigationMenu as any).create(app);

    // 少し遅らせて dispatch（Admin attach 待ち）
    setTimeout(() => {
      navMenu.dispatch(NavigationMenu.Action.UPDATE, {
        items: [
          { label: "ダッシュボード", destination: "/admin/dashboard" },
          { label: "アクセスログ", destination: "/admin/logs" },
          { label: "管理者設定", destination: "/admin/admin-ip" },
          { label: "ブロック設定", destination: "/admin/block-ip" },
        ],
      });
      console.log("🟢 NavigationMenu dispatch 実行完了");
    }, 500);

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
