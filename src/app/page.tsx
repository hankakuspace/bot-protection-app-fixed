// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function Home() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) {
      console.warn("⚠️ AppBridge not initialized yet. Waiting...");
      return;
    }

    console.log("🟢 NavigationMenu attaching from root /");

    // ✅ v2系構文：items を as any で通す
    const items = [
      { label: "ダッシュボード", destination: "/apps/bot-protection-proxy/dashboard" },
      { label: "アクセスログ", destination: "/apps/bot-protection-proxy/admin/logs" },
      { label: "管理者設定", destination: "/apps/bot-protection-proxy/admin/settings" },
      { label: "ブロック設定", destination: "/apps/bot-protection-proxy/admin/list-ip" },
    ] as any;

    const menu = NavigationMenu.create(app, { items });
    console.log("✅ NavigationMenu attached from root:", menu);
  }, [app]);

  return (
    <main>
      <h1>Bot Guard MAN</h1>
      <p>トップ階層で NavigationMenu を attach 済み。</p>
      <p>左サイドナビに「ダッシュボード / アクセスログ / 管理者設定 / ブロック設定」が表示されるはずです。</p>
    </main>
  );
}
