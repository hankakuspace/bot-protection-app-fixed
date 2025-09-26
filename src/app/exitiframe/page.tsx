// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop"); // 例: ruhra-store.myshopify.com

    if (shop) {
      const shopName = shop.replace(".myshopify.com", ""); // ✅ ドメイン部分を削除
      const handle = "bot-protection-proxy";
      const target = `https://admin.shopify.com/store/${shopName}/apps/${handle}`;
      (window.top ?? window).location.href = target;
    }
  }, []);

  return <p>Redirecting to Shopify Admin…</p>;
}
