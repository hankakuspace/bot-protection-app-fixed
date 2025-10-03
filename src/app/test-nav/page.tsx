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
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <ui-nav-menu>
              <a href="/dashboard">ダッシュボード</a>
              <a href="/logs">アクセスログ</a>
              <a href="/admin-ip">管理者設定</a>
              <a href="/block-ip">ブロック設定</a>
            </ui-nav-menu>
          `,
        }}
      />
    </main>
  );
}
