// src/app/nav-test/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

export default function NavTest() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    console.log("🟢 [NavTest] AppBridge from context:", app);

    if (!app) {
      console.error("❌ AppBridge がまだ初期化されていません");
      return;
    }

    // Web Components 登録確認をループで監視
    const interval = setInterval(() => {
      const defined = customElements.get("ui-nav-menu");
      console.log("🔍 ui-nav-menu defined?:", defined);
      if (defined) {
        clearInterval(interval);
        console.log("✅ ui-nav-menu が定義されました");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [app]);

  return (
    <main>
      <h1>Nav Test (AppBridgeProvider 使用)</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: "<ui-nav-menu></ui-nav-menu>",
        }}
      />
    </main>
  );
}
