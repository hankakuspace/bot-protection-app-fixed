// src/app/layout.tsx
import { headers } from "next/headers";
import "./globals.css";
import LogAccessClient from "@/components/LogAccessClient";
import { Provider } from "@shopify/app-bridge-react";
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

  // ✅ host はクエリから取得するため初期値は空でOK
  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
    host: "", // 実際は NavigationMenu 側で取得
    forceRedirect: true,
  };

  return (
    <html lang="ja">
      <head>
        <meta name="x-client-ip" content={ip} />
      </head>
      <body>
        {/* アクセスログ送信 */}
        <LogAccessClient ip={ip} />

        {/* Shopify AppBridge Provider */}
        <Provider config={config}>
          {/* Shopify 管理画面左メニュー */}
          <AppNavigationMenu />

          {/* 各ページ */}
          {children}
        </Provider>
      </body>
    </html>
  );
}
