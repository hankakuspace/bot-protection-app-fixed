// src/app/nav-test/page.tsx
// debug: ensure dynamic rendering is enabled   ← この1行を追加
"use client";


import { useEffect, useState } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

// ✅ 静的プリレンダリングを禁止
export const dynamic = "force-dynamic";

export default function NavTest() {
  const app = useAppBridgeCustom();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!app) {
      console.warn("⏳ AppBridge 初期化待ち...");
      return;
    }

    console.log("🟢 [NavTest] AppBridge from context:", app);

    // AppBridge 準備後にメニューを表示
    const timer = setTimeout(() => setShowMenu(true), 1500);
    return () => clearTimeout(timer);
  }, [app]);

  useEffect(() => {
    if (!showMenu) return;

    const interval = setInterval(() => {
      const defined = customElements.get("ui-nav-menu");
      console.log("🔍 ui-nav-menu defined?:", defined);
      if (defined) {
        clearInterval(interval);
        console.log("✅ ui-nav-menu が定義されました");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showMenu]);

  return (
    <main>
      <h1>Nav Test (AppBridgeProvider 使用)</h1>
      {!app && <p>⏳ AppBridge 初期化中...</p>}
      {showMenu && (
        <div
          dangerouslySetInnerHTML={{
            __html: "<ui-nav-menu></ui-nav-menu>",
          }}
        />
      )}
    </main>
  );
}
