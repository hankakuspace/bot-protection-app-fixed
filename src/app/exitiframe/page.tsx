// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");

    if (shop) {
      // ✅ /api/auth に戻すが、無限ループ防止に force=1 を付与
      const target = `/api/auth?shop=${shop}&force=1`;
      (window.top ?? window).location.href = target;
    }
  }, []);

  return <p>Redirecting to Shopify…</p>;
}
