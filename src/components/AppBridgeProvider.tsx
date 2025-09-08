// src/components/AppBridgeProvider.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import createApp, { AppConfig } from "@shopify/app-bridge";
import { Provider } from "@shopify/app-bridge-react";

export default function AppBridgeProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHost(params.get("host"));
  }, []);

  const app = useMemo(() => {
    if (!host) return null;

    const config: AppConfig = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
      host,
      forceRedirect: true,
    };

    return createApp(config);
  }, [host]);

  if (!app) return null;

  // 🔑 公式の Provider を利用する
  return <Provider config={app}>{children}</Provider>;
}
