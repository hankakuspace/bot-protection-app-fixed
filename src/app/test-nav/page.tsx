// src/app/test-nav/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

export default function TestNavPage() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) return;

    const urlParams = new URLSearchParams(window.location.search);
    const host = urlParams.get("host") || "";

    // 既存 nav を削除
    document.querySelectorAll("ui-nav-menu").forEach(el => el.remove());

    // nav-menu 作成
    const navMenuEl = document.createElement("ui-nav-menu");

    navMenuEl.innerHTML = `
      <ui-nav-menu-item label="ダッシュボード" href="/dashboard?host=${host}"></ui-nav-menu-item>
      <ui-nav-menu-item label="アクセスログ" href="/logs?host=${host}"></ui-nav-menu-item>
      <ui-nav-menu-item label="管理者設定" href="/admin-ip?host=${host}"></ui-nav-menu-item>
      <ui-nav-menu-item label="ブロック設定" href="/block-ip?host=${host}"></ui-nav-menu-item>
    `;

    document.body.appendChild(navMenuEl);
    console.log("🟢 ui-nav-menu injected with items (slot-based)");
    
    return () => navMenuEl.remove();
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      <p>ナビテストページ</p>
    </main>
  );
}
