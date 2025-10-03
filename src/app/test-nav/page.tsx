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
      {/* ✅ JSX の代わりに HTML文字列で埋め込み → 型エラー回避 */}
      <div
        dangerouslySetInnerHTML={{
          __html: `<ui-nav-menu items='[{"label":"ダッシュボード","destination":"/dashboard"}]'></ui-nav-menu>`,
        }}
      />
    </main>
  );
}
