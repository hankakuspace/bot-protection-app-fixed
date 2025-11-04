// src/lib/AppBridgeProvider.tsx
"use client";

import { useEffect, useState } from "react";

// ✅ require() で CommonJS モジュールをロード
const Provider = require("@shopify/app-bridge-react");

export default function AppBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const host = new URLSearchParams(window.location.search).get("host");
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

    if (host && apiKey) {
      setConfig({
        apiKey,
        host,
        forceRedirect: true,
      });
    }
  }, []);

  if (!config) return null;

  return <Provider config={config}>{children}</Provider>;
}
