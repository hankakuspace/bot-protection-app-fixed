// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // ✅ CSR（iframe 内で redirect() が無視される場合に対応）
  useEffect(() => {
    router.replace("/admin/logs");
  }, [router]);

  // ✅ SSR（直叩き時はサーバーサイドでリダイレクト）
  redirect("/admin/logs");

  return null;
}
