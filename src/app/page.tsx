// src/app/page.tsx
export default function Home() {
  // ✅ サポート提出用: <ui-nav-menu> を生HTMLとして出力
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <ui-nav-menu>
            <a href="/admin/dashboard">Dashboard</a>
            <a href="/admin/logs">Logs</a>
            <a href="/admin/admin-ip">Admin IP</a>
            <a href="/admin/block-ip">Block IP</a>
          </ui-nav-menu>
        `,
      }}
    />
  );
}
