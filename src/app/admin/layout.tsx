// src/app/admin/layout.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AppProvider, Frame, Navigation } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [host, setHost] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";

  useEffect(() => {
    (
      window as Window & { ShopifyAppBridgeWebComponents?: string }
    ).ShopifyAppBridgeWebComponents = "disabled";

    const params = new URLSearchParams(window.location.search);
    const hostFromQuery = params.get("host") || "";
    const hostFromStorage = sessionStorage.getItem("shopify-host") || "";
    const resolvedHost = hostFromQuery || hostFromStorage || "";

    if (hostFromQuery) {
      sessionStorage.setItem("shopify-host", hostFromQuery);
    }

    setHost(resolvedHost);
    setIsReady(true);

    console.log(
      "✅ AppBridge v3 active - forced disable of Shopify WebComponents loader",
    );
  }, []);

  const navigationMarkup = useMemo(() => {
    return (
      <Navigation location="/">
        <Navigation.Section
          items={[
            { label: "Dashboard", url: "/admin" },
            { label: "Logs", url: "/admin/logs" },
            { label: "Blocked IPs", url: "/admin/list-ip" },
            { label: "Add IP", url: "/admin/add-ip" },
          ]}
        />
      </Navigation>
    );
  }, []);

  if (!isReady) {
    return <div style={{ padding: "2rem" }}>⌛ Admin layout 初期化中...</div>;
  }

  const content = (
    <AppProvider>
      <Frame navigation={navigationMarkup}>{children}</Frame>
    </AppProvider>
  );

  if (!apiKey || !host) {
    console.warn("AdminLayout: App Bridge disabled on direct access", {
      hasApiKey: Boolean(apiKey),
      hasHost: Boolean(host),
    });

    return content;
  }

  return (
    <AppBridgeProvider
      config={{
        apiKey,
        host,
        forceRedirect: true,
      }}
    >
      {content}
    </AppBridgeProvider>
  );
}
