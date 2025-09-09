// src/app/page.tsx
"use client";

export default function Home() {
  return (
    <div>
      <h1>ナビゲーションテスト</h1>
      {/* Shopify サポートが提示した Web Components API 版 */}
      <ui-nav-menu>
        <a href="/" rel="home">ダッシュボード</a>
        <a href="/add-ip">IP追加</a>
        <a href="/blocklist">ブロックリスト</a>
        <a href="/logs">ログ</a>
      </ui-nav-menu>
    </div>
  );
}
