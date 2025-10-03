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
            <ui-nav-menu
              navigationLinks='[
                {"label": "ダッシュボード", "destination": "/dashboard"},
                {"label": "アクセスログ", "destination": "/logs"},
                {"label": "管理者設定", "destination": "/admin-ip"},
                {"label": "ブロック設定", "destination": "/block-ip"}
              ]'
            ></ui-nav-menu>
          `,
        }}
      />
    </main>
  );
}
