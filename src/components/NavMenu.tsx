// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";

// ✅ このファイル自体を module として扱うために export {} を記載
export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ui-nav-menu": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export default function NavMenu() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@shopify/app-bridge-web-components";
    script.onload = () => console.log("✅ app-bridge-web-components loaded");
    script.onerror = (err) =>
      console.error("❌ failed to load app-bridge-web-components", err);
    document.body.appendChild(script);
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
