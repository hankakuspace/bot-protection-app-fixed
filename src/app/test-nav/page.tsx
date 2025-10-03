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

    NavigationMenu.create(app, {
      items: [
        { label: "ダッシュボード", destination: "/apps/bot-protection-app-fixed/dashboard" },
        { label: "アクセスログ", destination: "/apps/bot-protection-app-fixed/admin/logs" },
        { label: "管理者設定", destination: "/apps/bot-protection-app-fixed/admin/settings" },
        { label: "ブロック設定", destination: "/apps/bot-protection-app-fixed/admin/list-ip" },
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
