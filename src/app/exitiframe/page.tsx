// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage() {
  useEffect(() => {
    // 現在の URL から shop/host を取り出す
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");
    const host = params.get("host");

    // host が無い場合は Shopify Admin が iframe 経由で開いたときに付与される
    const target = host
      ? `/?shop=${shop ?? ""}&host=${host}`
      : `/?shop=${shop ?? ""}`;

    if (window.top === window.self) {
      window.location.href = target;
    } else {
      (window.top ?? window).location.href = target;
    }
  }, []);

  return <p>Loading app...</p>;
}
