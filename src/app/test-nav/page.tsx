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

    // 既存を削除
    document.querySelectorAll("ui-nav-menu").forEach(el => el.remove());

    // nav-menu を生成
    const navMenuEl = document.createElement("ui-nav-menu");
    navMenuEl.setAttribute(
      "items",
      JSON.stringify([
        { label: "ダッシュボード", destination: `/dashboard?host=${host}` },
        { label: "アクセスログ", destination: `/logs?host=${host}` },
        { label: "管理者設定", destination: `/admin-ip?host=${host}` },
        { label: "ブロック設定", destination: `/block-ip?host=${host}` },
      ])
    );

    // body 直下に追加
    document.body.appendChild(navMenuEl);
    console.log("🟢 ui-nav-menu injected with host:", host);

    return () => navMenuEl.remove();
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      <p>ナビテストページ</p>
    </main>
  );
}
