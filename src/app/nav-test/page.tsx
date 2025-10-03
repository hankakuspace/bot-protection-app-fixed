// src/app/nav-test/page.tsx
"use client";

import { useEffect } from "react";
import { createApp } from "@shopify/app-bridge";

export default function NavTest() {
  useEffect(() => {
    const host = new URLSearchParams(window.location.search).get("host");
    console.log("🟢 host param:", host);

    if (!host) {
      console.error("❌ host missing. Admin から開いてください");
      return;
    }

    const app = createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    });
    console.log("🟢 AppBridge created:", app);

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
  }, []);

  return (
    <main>
      <h1>Nav Test</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: "<ui-nav-menu></ui-nav-menu>",
        }}
      />
    </main>
  );
}
