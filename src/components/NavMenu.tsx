// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";

export default function NavMenu() {
  useEffect(() => {
    // ✅ Web Components スクリプトを CDN からロード
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@shopify/app-bridge-web-components";
    script.onload = () => console.log("✅ app-bridge-web-components loaded");
    script.onerror = (err) =>
      console.error("❌ failed to load app-bridge-web-components", err);
    document.body.appendChild(script);
  }, []);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <ui-nav-menu>
            <a href="/admin/dashboard">ダッシュボード</a>
            <a href="/admin/logs">アクセスログ</a>
            <a href="/admin/admin-ip">管理者設定</a>
            <a href="/admin/block-ip">ブロック設定</a>
          </ui-nav-menu>
        `,
      }}
    />
  );
}
