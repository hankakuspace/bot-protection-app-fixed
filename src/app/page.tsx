// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // ✅ サポート返答後に確認用で残しておく
  /*
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
  */

  // ✅ 現状はダッシュボードへリダイレクト
  redirect("/admin/dashboard");
}
