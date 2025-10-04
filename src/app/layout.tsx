// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bot Guard MAN",
  description: "Shopify bot protection app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* App Bridge 本体 */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        {/* Web Components ローダー（埋め込み iframe 内で実行確認用） */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge-ui-components/v1.0/index.js"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
