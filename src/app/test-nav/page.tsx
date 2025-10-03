// src/app/test-nav/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function TestNavPage() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) return;

    console.log("🟢 NavigationMenu attaching...");

    // ✅ items に NavigationMenu.Action[] 型を明示
    const items: NavigationMenu.Action[] = [
      { label: "ダッシュボード", destination: "/dashboard" },
      { label: "アクセスログ", destination: "/admin/logs" },
      { label: "管理者設定", destination: "/admin/settings" },
      { label: "ブロック設定", destination: "/admin/list-ip" },
    ];

    NavigationMenu.create(app, { items });
  }, [app]);

  return (
    <main>
      <h1>Test NavigationMenu (Actions API)</h1>
      <p>AppBridge NavigationMenu を attach 済み。</p>
    </main>
  );
}
