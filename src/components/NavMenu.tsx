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

    const urlParams = new URLSearchParams(window.location.search);
    const host = urlParams.get("host") || "";

    setTimeout(() => {
      navMenu.dispatch(NavigationMenu.Action.UPDATE, {
        items: [
          { label: "ダッシュボード", destination: `/dashboard?host=${host}` },
          { label: "アクセスログ", destination: `/logs?host=${host}` },
          { label: "管理者設定", destination: `/admin-ip?host=${host}` },
          { label: "ブロック設定", destination: `/block-ip?host=${host}` },
        ],
      });
      console.log("🟢 NavigationMenu dispatch (host 付き URL 形式)");
    }, 500);

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
