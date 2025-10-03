// src/app/nav-test/page.tsx
"use client";

import { useEffect } from "react";
import { createApp } from "@shopify/app-bridge";
// ✅ Web Components ローダーを明示的に import
import "@shopify/app-bridge-web-components";

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

    // Web Components 登録確認
    console.log("🟢 ui-nav-menu defined?:", customElements.get("ui-nav-menu"));
  }, []);

  return (
    <main>
      <h1>Nav Test</h1>
      {/* ローダーによってアップグレードされる */}
      <div dangerouslySetInnerHTML={{ __html: "<ui-nav-menu></ui-nav-menu>" }} />
    </main>
  );
}
