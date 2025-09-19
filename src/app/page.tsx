// src/app/page.tsx
"use client";

export default function Home() {
  return (
    <div>
      <h1>ナビゲーションテスト</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <ui-nav-menu>
              <a href="/admin/dashboard">ダッシュボード</a>
              <a href="/admin/admin-ip">管理者IP</a>
              <a href="/admin/block-ip">ブロックIP</a>
              <a href="/admin/logs">アクセスログ</a>
            </ui-nav-menu>
          `,
        }}
      />
    </div>
  );
}
