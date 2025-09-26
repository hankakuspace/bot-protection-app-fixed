// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");

    if (shop) {
      const handle = "bot-protection-proxy"; // アプリハンドル
      const target = `https://admin.shopify.com/store/${shop}/apps/${handle}`;
      (window.top ?? window).location.href = target;
    }
  }, []);

  return <p>Redirecting to Shopify Admin…</p>;
}
