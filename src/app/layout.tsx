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
        {/* ✅ Shopifyナビを描画するが本文には表示しない */}
        <div
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{
            __html: `
              <ui-nav-menu>
                <a href="/admin/dashboard">ダッシュボード</a>
                <a href="/admin/logs">アクセスログ</a>
                <a href="/admin/admin-ip">管理者設定</a>
                <a href="/admin/block-ip">ブロック設定</a>
              </ui-nav-menu>
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
