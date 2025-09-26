// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");

    // ✅ Shopify Admin 内のアプリURLに直接戻す
    // handle = Partner Dashboard の App name と同じ "bot-protection-proxy"
    const handle = "bot-protection-proxy";
    const target = `https://admin.shopify.com/store/${shop}/apps/${handle}`;

    if (window.top === window.self) {
      window.location.href = target;
    } else {
      (window.top ?? window).location.href = target;
    }
  }, []);

  return <p>Loading app...</p>;
}
