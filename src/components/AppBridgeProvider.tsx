// src/components/AppBridgeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import createApp, { AppConfig } from "@shopify/app-bridge";

const AppBridgeContext = createContext<any>(null);

export function useAppBridge() {
  return useContext(AppBridgeContext);
}

export default function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get("host") || "";

    const config: AppConfig = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
      host,
      forceRedirect: true,
    };

    setApp(createApp(config));
  }, []);

  if (!app) return null;

  return <AppBridgeContext.Provider value={app}>{children}</AppBridgeContext.Provider>;
}
