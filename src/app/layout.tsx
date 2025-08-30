// src/app/layout.tsx
"use client";

import { headers } from "next/headers";
import "./globals.css";
import LogAccessClient from "@/components/LogAccessClient";
import { AppBridgeProvider } from "@shopify/app-bridge-react";
import { ReactNode, useEffect, useState } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [host, setHost] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHost(params.get("host") || "");
  }, []);

  let ip = "UNKNOWN";
  try {
    const h = headers();
    ip = h.get("x-client-ip") || "UNKNOWN";
  } catch {
    ip = "UNKNOWN";
  }

  return (
    <html lang="ja">
      <head>
        <meta name="x-client-ip" content={ip} />
      </head>
      <body>
        {/* アクセスログ送信 */}
        <LogAccessClient ip={ip} />

        {/* Shopify AppBridge Provider */}
        <AppBridgeProvider
          config={{
            apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
            host: host,
            forceRedirect: true,
          }}
        >
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
