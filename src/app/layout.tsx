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
        {/* App Bridge 本体（最初の <script> タグ、async/defer/module 禁止） */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>

        {/* Web Components ローダー */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge-ui-components/latest/index.js"></script>
      </head>
      <body>
        <AppBridgeProvider>
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
