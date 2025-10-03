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
        {/* App Bridge 本体（非モジュール） */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>

        {/* Web Components ローダー（ESM版 → 明示的に type="module" を指定） */}
        <script
          type="module"
          src="https://cdn.shopify.com/shopifycloud/app-bridge-ui-components/latest/index.js"
        ></script>
      </head>
      <body>
        <AppBridgeProvider>
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
