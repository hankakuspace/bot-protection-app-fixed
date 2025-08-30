// src/components/ClientProviders.tsx
"use client";

import { AppBridgeProvider } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHost(params.get("host") || "");
  }, []);

  return (
    <AppBridgeProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
        host,
        forceRedirect: true,
      }}
    >
      {children}
    </AppBridgeProvider>
  );
}
