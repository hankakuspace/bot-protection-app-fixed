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

    setTimeout(() => {
      navMenu.dispatch(NavigationMenu.Action.UPDATE, {
        items: [
          { label: "ダッシュボード", destination: "/dashboard" },
          { label: "アクセスログ", destination: "/logs" },
          { label: "管理者設定", destination: "/admin-ip" },
          { label: "ブロック設定", destination: "/block-ip" },
        ],
      });
      console.log("🟢 NavigationMenu dispatch (相対パス /dashboard 形式)");
    }, 500);

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
