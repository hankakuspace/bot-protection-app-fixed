// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AppBridgeProvider } from "@/lib/AppBridgeProvider";

export const metadata: Metadata = {
  title: "Bot Guard MAN",
  description: "Shopify bot protection app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("🟢 RootLayout loaded");

  return (
    <html lang="ja">
      <head>
        {/* ✅ AppBridge 本体のみを読み込む（Web Components ローダーは完全削除） */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      </head>
      <body>
        <AppBridgeProvider>{children}</AppBridgeProvider>
      </body>
    </html>
  );
}
