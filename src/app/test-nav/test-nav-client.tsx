// src/app/test-nav/test-nav-client.tsx
"use client";

import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

export default function ClientTestNav() {
  const app = useAppBridgeCustom();

  return (
    <div>
      <h1>Test Nav Page</h1>
      <p>AppBridge: {app ? "✅ 初期化済み" : "❌ 未初期化"}</p>
    </div>
  );
}
