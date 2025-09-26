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
    // ✅ host を URL または localStorage から取得
    let host =
      new URLSearchParams(window.location.search).get("host") ||
      localStorage.getItem("shopify_host") ||
      "";

    if (!host) {
      console.warn("⚠️ host is missing, App Bridge not initialized");
      return;
    }

    // ✅ host を保存（次回以降も使えるようにする）
    localStorage.setItem("shopify_host", host);

    const config: AppConfig = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    };

    const appInstance = createApp(config);
    setApp(appInstance);
  }, []);

  return (
    <AppBridgeContext.Provider value={{ app }}>
      {children}
    </AppBridgeContext.Provider>
  );
}
