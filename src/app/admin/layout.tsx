// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { AppProvider, Frame, Navigation } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    const h = new URLSearchParams(window.location.search).get("host");
    if (h) sessionStorage.setItem("shopify-host", h);
    setHost(h || sessionStorage.getItem("shopify-host"));
    console.log("✅ AppBridge v3 active - no loader.js");
  }, []);

  if (!host) return null;

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          { label: "Dashboard", url: "/admin" },
          { label: "Logs", url: "/admin/logs" },
          { label: "Blocked IPs", url: "/admin/list-ip" },
        ]}
      />
    </Navigation>
  );

  return (
    <AppBridgeProvider
      config={{ apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!, host, forceRedirect: true }}
    >
      <AppProvider>
        <Frame navigation={navigationMarkup}>{children}</Frame>
      </AppProvider>
    </AppBridgeProvider>
  );
}
