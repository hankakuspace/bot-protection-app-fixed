// src/app/test-nav/page.tsx

// ✅ 静的生成を完全に無効化
export const dynamic = "force-dynamic";

"use client";

import { AppBridgeProvider } from "@/lib/AppBridgeProvider";
import ClientTestNav from "./test-nav-client";

export default function TestNavPage() {
  return (
    <AppBridgeProvider>
      <ClientTestNav />
    </AppBridgeProvider>
  );
}
