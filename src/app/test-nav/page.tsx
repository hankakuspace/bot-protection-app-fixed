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

    // すでに存在する nav-menu 要素を探す
    const existing = document.querySelector("ui-nav-menu");

    if (existing) {
      existing.setAttribute(
        "items",
        JSON.stringify([
          { label: "ダッシュボード", destination: `/dashboard?host=${host}` },
          { label: "アクセスログ", destination: `/logs?host=${host}` },
          { label: "管理者設定", destination: `/admin-ip?host=${host}` },
          { label: "ブロック設定", destination: `/block-ip?host=${host}` },
        ])
      );
      console.log("🟢 ui-nav-menu updated with host:", host);
    } else {
      console.warn("⚠️ ui-nav-menu placeholder not found");
    }
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      <p>ナビテストページ</p>
    </main>
  );
}
