// src/lib/AppBridgeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createApp, type ClientApplication } from "@shopify/app-bridge";

interface AppBridgeContextType {
  app: ClientApplication | null;
}

const AppBridgeReactContext = createContext<AppBridgeContextType>({ app: null });

export function useAppBridgeCustom() {
  return useContext(AppBridgeReactContext).app;
}

export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState<ClientApplication | null>(null);

  useEffect(() => {
    // ✅ host を URL または localStorage から取得
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

    const appInstance = createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
    });

    console.log("🟢 [AppBridgeProvider] created app:", appInstance);
    setApp(appInstance);
  }, []);

  return (
    <AppBridgeReactContext.Provider value={{ app }}>
      {children}
    </AppBridgeReactContext.Provider>
  );
}
