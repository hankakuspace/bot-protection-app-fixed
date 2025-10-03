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
      {/* ✅ 最小限の ui-nav-menu を直接描画 */}
      <ui-nav-menu
        items='[{"label":"ダッシュボード","destination":"/dashboard"}]'
      ></ui-nav-menu>
    </main>
  );
}
