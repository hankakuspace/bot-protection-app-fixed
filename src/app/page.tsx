// src/app/page.tsx
export default function Home() {
  // ✅ サポート提出用: <ui-nav-menu> をSSR出力
  // @ts-expect-error
  return (
    <ui-nav-menu>
      <a href="/admin/dashboard">Dashboard</a>
      <a href="/admin/logs">Logs</a>
      <a href="/admin/admin-ip">Admin IP</a>
      <a href="/admin/block-ip">Block IP</a>
    {/* @ts-expect-error */}
    </ui-nav-menu>
  );
}
