// src/lib/AppBridgeProvider.tsx
"use client";

import { useEffect, useState } from "react";

// CommonJS の require で Provider を取得
let Provider: any;
try {
  Provider = require("@shopify/app-bridge-react");
  console.log("🧩 AppBridgeReact Provider loaded:", Provider);
} catch (e) {
  console.error("❌ AppBridgeReact require failed:", e);
}

export default function AppBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host");
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
    console.log("🧩 AppBridge init", { host, apiKey });

    if (!host || !apiKey) {
      console.error("❌ Missing host or apiKey for App Bridge");
      return;
    }

    setConfig({ apiKey, host, forceRedirect: true });
  }, []);

  if (!Provider) return <div>❌ AppBridge Provider not loaded</div>;
  if (!config) return <div>⌛ AppBridge waiting for config...</div>;

  console.log("✅ Rendering AppBridge Provider with config:", config);
  return <Provider config={config}>{children}</Provider>;
}
