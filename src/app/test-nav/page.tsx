"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function TestNavPage() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) return;

    console.log("🟢 NavigationMenu attaching via Actions API...");

    // ✅ 現行Shopify App Bridge APIでattachする（最も安定）
    const navigationMenu = NavigationMenu.create(app, {
      items: [
        { label: "ダッシュボード", destination: "/apps/bot-protection-app-fixed/dashboard" },
        { label: "アクセスログ", destination: "/apps/bot-protection-app-fixed/admin/logs" },
        { label: "管理者設定", destination: "/apps/bot-protection-app-fixed/admin/settings" },
        { label: "ブロック設定", destination: "/apps/bot-protection-app-fixed/admin/list-ip" },
      ],
    });

    console.log("✅ NavigationMenu attached:", navigationMenu);
  }, [app]);

  return (
    <main>
      <h1>NavigationMenu (Actions API版)</h1>
      <p>Shopify Admin 左サイドにメニューをattachしています。</p>
    </main>
  );
}
