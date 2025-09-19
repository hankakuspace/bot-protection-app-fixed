// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // ✅ 将来サポート確認用にコメントアウトで残す
  /*
  return (
    <ui-nav-menu>
      <a href="/admin/dashboard">Dashboard</a>
      <a href="/admin/logs">Logs</a>
      <a href="/admin/admin-ip">Admin IP</a>
      <a href="/admin/block-ip">Block IP</a>
    </ui-nav-menu>
  );
  */

  // ✅ 現状はダッシュボードへリダイレクト
  redirect("/admin/dashboard");
}
