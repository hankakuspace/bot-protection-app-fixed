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
      <body>
        {/* ✅ Shopify 標準ナビゲーションを body 直下に直書き */}
        {/* @ts-ignore */}
        <ui-nav-menu>
          <a href="/admin/dashboard">ダッシュボード</a>
          <a href="/admin/logs">アクセスログ</a>
          <a href="/admin/admin-ip">管理者設定</a>
          <a href="/admin/block-ip">ブロック設定</a>
        </ui-nav-menu>

        {children}
      </body>
    </html>
  );
}
