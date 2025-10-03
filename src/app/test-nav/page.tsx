// src/app/test-nav/page.tsx
"use client";

// ✅ 静的生成を完全に無効化
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { AppBridgeProvider } from "@/lib/AppBridgeProvider";
import ClientTestNav from "./test-nav-client";

export default function TestNavPage() {
  return (
    <AppBridgeProvider>
      <ClientTestNav />
    </AppBridgeProvider>
  );
}
