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

    // nav-menu を作成
    const navMenuEl = document.createElement("ui-nav-menu");
    navMenuEl.innerHTML = `
      <a href="/dashboard?host=${host}">ダッシュボード</a>
      <a href="/logs?host=${host}">アクセスログ</a>
      <a href="/admin-ip?host=${host}">管理者設定</a>
      <a href="/block-ip?host=${host}">ブロック設定</a>
    `;

    // Shopify Admin のルート要素に追加
    const root = document.querySelector("shopify-app-root") || document.body;
    root.appendChild(navMenuEl);

    console.log("🟢 ui-nav-menu appended to shopify-app-root with host:", host);

    return () => navMenuEl.remove();
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      <p>ナビテストページ</p>
    </main>
  );
}
