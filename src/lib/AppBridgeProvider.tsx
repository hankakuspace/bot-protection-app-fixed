// src/lib/AppBridgeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { createApp, type ClientApplication } from "@shopify/app-bridge";
import { Redirect } from "@shopify/app-bridge/actions";

interface AppBridgeContextType {
  app: ClientApplication | null;
}

const AppBridgeReactContext = createContext<AppBridgeContextType>({ app: null });

export function useAppBridgeCustom() {
  return useContext(AppBridgeReactContext).app;
}

export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  let host =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("host") || ""
      : "";

  if (typeof window !== "undefined") {
    if (host) {
      localStorage.setItem("shopify_host", host);
    } else {
      host = localStorage.getItem("shopify_host") || "";
    }
  }

  const app = useMemo(() => {
    if (typeof window === "undefined" || !host) return null;
    return createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
    });
  }, [host]);

  return (
    <AppBridgeReactContext.Provider value={{ app }}>
      {children}
    </AppBridgeReactContext.Provider>
  );
}
