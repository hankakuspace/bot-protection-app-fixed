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
    const fromUrl = new URLSearchParams(window.location.search).get("host");
    let host = fromUrl || localStorage.getItem("shopify_host") || "";

    console.log("🟢 [AppBridgeProvider] init host:", host);

    if (!host) {
      console.warn("⚠️ [AppBridgeProvider] host missing, App Bridge not initialized");
      return;
    }

    if (fromUrl) {
      localStorage.setItem("shopify_host", fromUrl);
    }

    const config: AppConfig = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    };

    console.log("🟢 [AppBridgeProvider] init config:", config);

    const appInstance = createApp(config);
    console.log("🟢 [AppBridgeProvider] created app:", appInstance);

    setApp(appInstance);
  }, []);

  return <AppBridgeContext.Provider value={{ app }}>{children}</AppBridgeContext.Provider>;
}
