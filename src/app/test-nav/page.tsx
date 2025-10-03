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

    const params = new URLSearchParams(window.location.search);
    const host = params.get("host") || "";
    const baseUrl = `/apps/bot-protection-app-fixed`;

    NavigationMenu.create(app, {
      items: [
        { label: "ダッシュボード", destination: `${baseUrl}/dashboard?host=${host}` },
        { label: "アクセスログ", destination: `${baseUrl}/admin/logs?host=${host}` },
        { label: "管理者設定", destination: `${baseUrl}/admin/settings?host=${host}` },
        { label: "ブロック設定", destination: `${baseUrl}/admin/list-ip?host=${host}` },
      ] as any,
    });

    console.log("🟢 NavigationMenu attached");
  }, [app]);

  return (
    <main>
      <h1>Test NavigationMenu (Actions API)</h1>
      <p>AppBridge NavigationMenu を attach 済み。</p>
    </main>
  );
}
