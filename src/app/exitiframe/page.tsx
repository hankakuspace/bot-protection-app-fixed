// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");

    if (shop) {
      // ✅ Admin が再ロード時に host を必ず付与する
      const target = `/api/auth?shop=${shop}`;
      (window.top ?? window).location.href = target;
    }
  }, []);

  return <p>Loading app...</p>;
}
