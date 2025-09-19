// src/app/admin/layout.tsx
"use client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Shopify標準ナビゲーションを共通で描画 */}
      <div
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

      <main className="p-6">{children}</main>
    </div>
  );
}
