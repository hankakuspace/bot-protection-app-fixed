// src/app/_nav-test/page.tsx
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

    // Web Components の登録状態を確認
    console.log("🟢 ui-nav-menu defined?:", customElements.get("ui-nav-menu"));
  }, []);

  return (
    <main>
      <h1>Nav Test</h1>
      {/* JSX の型エラーを避けるため直書き */}
      <div dangerouslySetInnerHTML={{ __html: "<ui-nav-menu></ui-nav-menu>" }} />
    </main>
  );
}
