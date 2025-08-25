// src/components/AppBridgeProvider.tsx
"use client";

import React, { ReactNode, useMemo } from "react";
import createApp, { AppConfig } from "@shopify/app-bridge";

interface Props {
  children: ReactNode;
  host?: string;
}

export default function AppBridgeProvider({ children, host }: Props) {
  if (typeof window === "undefined") return <>{children}</>;

  const appConfig: AppConfig = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
    host: host || new URLSearchParams(window.location.search).get("host") || "",
    forceRedirect: true,
  };

  // AppBridge を初期化（必要なら Context 経由で子に渡せるよう拡張可能）
  useMemo(() => {
    createApp(appConfig);
  }, [appConfig.host]);

  return <>{children}</>;
}
