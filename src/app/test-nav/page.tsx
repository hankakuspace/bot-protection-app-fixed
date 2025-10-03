// src/app/test-nav/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function TestNavPage() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) return;

    const urlParams = new URLSearchParams(window.location.search);
    const host = urlParams.get("host") || "";

    // 型定義に依存せず any キャスト
    const navMenu = (NavigationMenu as any).create(app, {});

    navMenu.dispatch(NavigationMenu.Action.UPDATE, {
      items: [
        { label: "ダッシュボード", destination: `/dashboard?host=${host}` },
        { label: "アクセスログ", destination: `/logs?host=${host}` },
        { label: "管理者設定", destination: `/admin-ip?host=${host}` },
        { label: "ブロック設定", destination: `/block-ip?host=${host}` },
      ],
    });

    console.log("🟢 NavigationMenu dispatched with host:", host);
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      <p>ナビゲーションメニューをテスト中</p>
    </main>
  );
}
