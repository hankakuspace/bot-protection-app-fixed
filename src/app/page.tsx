// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { redirect } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  // ✅ CSRリダイレクト（iframe 内対応）
  useEffect(() => {
    if (host && shop) {
      // Shopify Admin 内から来た場合はそのまま保持
      console.log("✅ Loaded with host/shop:", { host, shop });
      router.replace(`/admin/logs?host=${host}&shop=${shop}`);
    } else {
      // 直叩きなど host がない場合は通常ログ画面へ
      router.replace("/admin/logs");
    }
  }, [router, host, shop]);

  // ✅ SSRリダイレクト（直叩き用）
  if (!host) {
    redirect("/admin/logs");
  }

  return null;
}
