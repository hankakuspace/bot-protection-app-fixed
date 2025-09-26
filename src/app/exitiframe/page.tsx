// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");

    // ✅ 再度 /api/auth に戻す
    const target = `/api/auth?shop=${shop}&force=1`;

    if (window.top === window.self) {
      window.location.href = target;
    } else {
      (window.top ?? window).location.href = target;
    }
  }, []);

  return <p>Loading app...</p>;
}
