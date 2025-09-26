// src/app/exitiframe/page.tsx
"use client";

import { useEffect } from "react";

export default function ExitIframePage({
  searchParams,
}: {
  searchParams: { shop?: string; host?: string };
}) {
  useEffect(() => {
    const target = `/?shop=${searchParams.shop}&host=${searchParams.host}`;
    if (window.top === window.self) {
      window.location.href = target;
    } else {
      window.top.location.href = target;
    }
  }, [searchParams]);

  return <p>Loading app...</p>;
}
