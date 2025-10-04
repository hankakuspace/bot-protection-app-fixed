// src/app/nav-test/page.tsx
"use client";

import { useEffect } from "react";
import { createApp } from "@shopify/app-bridge";

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

    // ✅ 実際に attach する
    if (defined) {
      console.log("🟢 creating <ui-nav-menu> element...");
    }
  }, []);

  return (
    <main>
      <h1>Nav Test</h1>
      <ui-nav-menu>
        <a href="/apps/bot-protection-proxy/test">テストリンク</a>
      </ui-nav-menu>
    </main>
  );
}
