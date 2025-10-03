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

    // Web Component 定義を待つ
    customElements.whenDefined("ui-nav-menu").then(() => {
      // 既存 nav を削除
      document.querySelectorAll("ui-nav-menu").forEach(el => el.remove());

      // nav-menu 作成
      const navMenuEl = document.createElement("ui-nav-menu");
      navMenuEl.innerHTML = `
        <a href="/dashboard?host=${host}">ダッシュボード</a>
        <a href="/logs?host=${host}">アクセスログ</a>
        <a href="/admin-ip?host=${host}">管理者設定</a>
        <a href="/block-ip?host=${host}">ブロック設定</a>
      `;

      // Admin の root へ追加
      const root = document.querySelector("shopify-app-root") || document.body;
      root.appendChild(navMenuEl);

      console.log("🟢 ui-nav-menu appended after definition with host:", host);
    });
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      <p>ナビテストページ</p>
    </main>
  );
}
