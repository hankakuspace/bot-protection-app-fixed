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

    const app = createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    });
    console.log("🟢 AppBridge created:", app);

    const defined = customElements.get("ui-nav-menu");
    console.log("🟢 ui-nav-menu defined?:", defined);
  }, []);

  return (
    <main>
      <h1>Nav Test</h1>
      {/* ✅ JSX ではなく createElement で生成（型エラー完全回避） */}
      {React.createElement(
        "ui-nav-menu",
        null,
        <a href="/apps/bot-protection-proxy/test">テストリンク</a>
      )}
    </main>
  );
}
