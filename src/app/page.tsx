// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function PageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  // ✅ CSRリダイレクト（iframe 内対応）
  useEffect(() => {
    if (host && shop) {
      console.log("✅ Loaded with host/shop:", { host, shop });
      router.replace(`/admin/logs?host=${host}&shop=${shop}`);
    } else {
      router.replace("/admin/logs");
    }
  }, [router, host, shop]);

  // ✅ SSRリダイレクト（直叩き用）
  if (!host) {
    redirect("/admin/logs");
  }

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageInner />
    </Suspense>
  );
}
