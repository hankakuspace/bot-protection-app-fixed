"use client";

import { useEffect } from "react";
import { createApp } from "@shopify/app-bridge";

// ✅ JSX の型チェックを強制的に無視させる
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ui-nav-menu": any;
    }
  }
}

export default function NavTestPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host") || "";
    console.log("🟢 host param:", host);

    if (!host) {
      console.warn("⚠️ host missing");
      return;
    }

    // ✅ App Bridge 初期化
    const app = createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    });
    console.log("🟢 AppBridge created:", app);

    // ✅ ローダー確認
    const defined = customElements.get("ui-nav-menu");
    console.log("🟢 ui-nav-menu defined?:", defined);
  }, []);

  return (
    <main>
      <h1>Nav Test</h1>
      {/* ✅ 型エラーを確実に回避 */}
      <ui-nav-menu>
        <a href="/apps/bot-protection-proxy/test">テストリンク</a>
      </ui-nav-menu>
    </main>
  );
}
