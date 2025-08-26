// src/app/layout.tsx
import { headers } from "next/headers";
import "./globals.css";
import LogAccessClient from "@/components/LogAccessClient";

// 追加
import { AppBridgeProvider } from "@shopify/app-bridge-react";
import AppNavigationMenu from "@/components/NavigationMenu";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let ip = "UNKNOWN";
  try {
    const h = await headers();
    ip = h.get("x-client-ip") || "UNKNOWN";
  } catch {
    ip = "UNKNOWN";
  }

  return (
    <html lang="ja">
      <head>
        <meta name="x-client-ip" content={ip} />
      </head>
      <body>
        {/* アクセスログ送信 */}
        <LogAccessClient ip={ip} />

        {/* Shopify アプリナビゲーション */}
        <AppBridgeProvider>
          <AppNavigationMenu />

          {/* 各ページ */}
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
