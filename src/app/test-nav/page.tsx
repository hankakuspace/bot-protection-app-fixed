// src/app/test-nav/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

export default function TestNavPage() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    console.log("🟢 TestNav mounted, app:", app);

    if (typeof window !== "undefined") {
      console.log("🟢 shopify global:", (window as any).shopify);
      console.log("🟢 ui-nav-menu registered:", customElements.get("ui-nav-menu"));
    }
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      {/* ✅ items 属性ではなく、子要素として定義 */}
      <ui-nav-menu>
        <ui-nav-menu-item label="ダッシュボード" destination="/dashboard"></ui-nav-menu-item>
        <ui-nav-menu-item label="アクセスログ" destination="/logs"></ui-nav-menu-item>
        <ui-nav-menu-item label="管理者設定" destination="/admin-ip"></ui-nav-menu-item>
        <ui-nav-menu-item label="ブロック設定" destination="/block-ip"></ui-nav-menu-item>
      </ui-nav-menu>
    </main>
  );
}
