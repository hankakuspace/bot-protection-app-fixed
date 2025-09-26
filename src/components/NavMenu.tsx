// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";

export default function NavMenu() {
  useEffect(() => {
    import("@shopify/app-bridge-web-components").then(() => {
      console.log("✅ Web Components loaded");
    });
  }, []);

  return (
    <ui-nav-menu>
      <a href="/admin/dashboard">ダッシュボード</a>
      <a href="/admin/logs">アクセスログ</a>
      <a href="/admin/admin-ip">管理者設定</a>
      <a href="/admin/block-ip">ブロック設定</a>
    </ui-nav-menu>
  );
}
