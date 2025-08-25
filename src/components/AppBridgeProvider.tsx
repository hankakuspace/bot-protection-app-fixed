// src/components/AppBridgeProvider.tsx
"use client";

import { ReactNode, useEffect } from "react";
import createApp, { AppConfig } from "@shopify/app-bridge";

interface Props {
  children: ReactNode;
  host?: string;
}

export default function AppBridgeProvider({ children, host }: Props) {
  useEffect(() => {
    const resolvedHost = host || new URLSearchParams(window.location.search).get("host") || "";
    console.log("🔥 AppBridge host:", resolvedHost);

    const config: AppConfig = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host: resolvedHost,
      forceRedirect: true,
    };

    if (resolvedHost) {
      createApp(config);
    }
  }, [host]);

  return <>{children}</>;
}
