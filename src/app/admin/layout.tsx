// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { AppProvider, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import * as appBridgeReact from "@shopify/app-bridge-react";

const AppBridgeProvider: any = (appBridgeReact as any).Provider || (appBridgeReact as any).default;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ✅ CDNのloader.jsをローカルに置き換える
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      if (typeof url === "string" && url.includes("shopifycloud/app-bridge-web-components")) {
        console.warn("⚠️ Redirecting loader.js request to /loader.js");
        return originalFetch("/loader.js", options);
      }
      return originalFetch(url, options);
    };

    // hostの取得
    const params = new URLSearchParams(window.location.search);
    const h = params.get("host");
    if (h) {
      sessionStorage.setItem("shopify-host", h);
      setHost(h);
    } else {
      setHost(sessionStorage.getItem("shopify-host"));
    }

    // loader.js ローカル読み込み
    const script = document.createElement("script");
    script.src = "/loader.js";
    script.onload = () => {
      console.log("✅ Local loader.js loaded");
      setReady(true);
    };
    script.onerror = () => console.error("❌ Failed to load local loader.js");
    document.head.appendChild(script);
  }, []);

  if (!ready || !host) return null;

  return (
    <AppBridgeProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host: host!,
        forceRedirect: true,
      }}
    >
      <AppProvider>
        <Frame>
          <s-app-nav>
            <s-nav-menu>
              <s-nav-menu-item label="Dashboard" />
              <s-nav-menu-item label="Logs" />
              <s-nav-menu-item label="Blocked IPs" />
            </s-nav-menu>
          </s-app-nav>
          {children}
        </Frame>
      </AppProvider>
    </AppBridgeProvider>
  );
}
