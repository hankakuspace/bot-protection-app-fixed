// src/app/page.tsx

export default function Home() {
  return (
    <>
      {/* ✅ サイドメニューをトップにも直書きしてテスト */}
      {/* @ts-expect-error */}
      <ui-nav-menu>
        <a href="/admin/dashboard">ダッシュボード</a>
        <a href="/admin/logs">アクセスログ</a>
        <a href="/admin/admin-ip">管理者設定</a>
        <a href="/admin/block-ip">ブロック設定</a>
      {/* @ts-expect-error */}
      </ui-nav-menu>

      <main style={{ padding: "2rem" }}>
        <h1>トップページ (テスト用)</h1>
        <p>ここにサイドメニューが表示されるか確認してください。</p>
      </main>
    </>
  );
}
