// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage({ searchParams }: any) {
  useEffect(() => {
    const shop = searchParams?.shop as string | undefined;
    const host = searchParams?.host as string | undefined;

    const target = `/?shop=${shop ?? ""}&host=${host ?? ""}`;
    if (window.top === window.self) {
      window.location.href = target;
    } else {
      // ✅ null チェックを加えて型エラー回避
      (window.top ?? window).location.href = target;
    }
  }, [searchParams]);

  return <p>Loading app...</p>;
}
