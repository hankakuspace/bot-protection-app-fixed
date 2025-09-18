// src/components/AppBridgeProvider.tsx
"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import createApp, { AppConfig, ClientApplication } from "@shopify/app-bridge";

interface AppBridgeContextValue {
  app: ClientApplication<any> | null;
}

const AppBridgeContext = createContext<AppBridgeContextValue>({ app: null });

export function useAppBridge() {
  return useContext(AppBridgeContext).app;
}

export default function AppBridgeProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<ClientApplication<any> | null>(null);

  useEffect(() => {
    const host = new URLSearchParams(window.location.search).get("host");
    if (!host) return;

    const config: AppConfig = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    };

    const appInstance = createApp(config);
    setApp(appInstance);
  }, []);

  return <AppBridgeContext.Provider value={{ app }}>{children}</AppBridgeContext.Provider>;
}
