// src/app/layout.tsx
"use client";

import { useEffect } from "react";
import { AppBridgeProvider } from "@/lib/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const app = (window as any).appBridge;
    if (!app) return;

    const items = [
      { label: "ダッシュボード", destination: "/apps/bot-protection-proxy/dashboard" },
      { label: "アクセスログ", destination: "/apps/bot-protection-proxy/admin/logs" },
      { label: "管理者設定", destination: "/apps/bot-protection-proxy/admin/settings" },
      { label: "ブロック設定", destination: "/apps/bot-protection-proxy/admin/list-ip" },
    ] as any;

    const menu = NavigationMenu.create(app, { items });
    console.log("✅ NavigationMenu attached from layout:", menu);
  }, []);

  return (
    <html lang="ja">
      <body>
        <AppBridgeProvider>{children}</AppBridgeProvider>
      </body>
    </html>
  );
}
