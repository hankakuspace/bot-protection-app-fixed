// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";

export default function NavMenu() {
  useEffect(() => {
    // ✅ Shopify公式CDNからWeb Componentsをロード
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://cdn.shopify.com/shopifycloud/app-bridge-web-components/latest/app-bridge-web-components.esm.js";
    script.onload = () => console.log("✅ app-bridge-web-components loaded");
    script.onerror = (err) =>
      console.error("❌ failed to load app-bridge-web-components", err);
    document.body.appendChild(script);
  }, []);

  return (
    <div
      style={{ display: "none" }} // SSRで本文に出ないように非表示
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
