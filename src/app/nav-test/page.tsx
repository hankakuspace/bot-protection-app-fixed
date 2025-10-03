// src/app/nav-test/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

export default function NavTest() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) {
      console.warn("⏳ AppBridge がまだ context に設定されていません。再レンダーを待ちます。");
      return;
    }

    console.log("🟢 [NavTest] AppBridge from context:", app);

    const interval = setInterval(() => {
      const defined = customElements.get("ui-nav-menu");
      console.log("🔍 ui-nav-menu defined?:", defined);
      if (defined) {
        clearInterval(interval);
        console.log("✅ ui-nav-menu が定義されました");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [app]); // ✅ app が更新されたら再実行

  return (
    <main>
      <h1>Nav Test (AppBridgeProvider 使用)</h1>
      {!app && <p>⏳ AppBridge 初期化中…</p>}
      <div
        dangerouslySetInnerHTML={{
          __html: "<ui-nav-menu></ui-nav-menu>",
        }}
      />
    </main>
  );
}
