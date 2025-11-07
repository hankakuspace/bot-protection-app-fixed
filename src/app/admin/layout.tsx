// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { AppProvider, Frame, Navigation } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const h = params.get("host");
    if (h) {
      sessionStorage.setItem("shopify-host", h);
      setHost(h);
    } else {
      setHost(sessionStorage.getItem("shopify-host"));
    }
    console.log("✅ AppBridge v3 active - host param loaded");
  }, []);

  if (!host) {
    console.log("⏳ Waiting for host param...");
    return null;
  }

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            label: "Dashboard",
            onClick: () => Redirect.create(window.appBridge).dispatch(
              Redirect.Action.APP, "/admin"
            ),
          },
          {
            label: "Logs",
            onClick: () => Redirect.create(window.appBridge).dispatch(
              Redirect.Action.APP, "/admin/logs"
            ),
          },
          {
            label: "Blocked IPs",
            onClick: () => Redirect.create(window.appBridge).dispatch(
              Redirect.Action.APP, "/admin/list-ip"
            ),
          },
        ]}
      />
    </Navigation>
  );

  return (
    <AppBridgeProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host,
        forceRedirect: true,
      }}
    >
      <AppProvider>
        <Frame navigation={navigationMarkup}>{children}</Frame>
      </AppProvider>
    </AppBridgeProvider>
  );
}
