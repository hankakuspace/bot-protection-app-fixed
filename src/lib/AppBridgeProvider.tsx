// src/lib/AppBridgeProvider.tsx
"use client";

// CJSモジュール構成なので名前付き import は不可
import AppBridgeReact from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";

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

  // CommonJS default export を直接呼び出す
  const Provider: any = (AppBridgeReact as any).Provider || AppBridgeReact;

  return <Provider config={config}>{children}</Provider>;
}
