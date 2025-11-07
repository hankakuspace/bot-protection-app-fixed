// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { AppProvider, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import * as appBridgeReact from "@shopify/app-bridge-react";

const AppBridgeProvider: any =
  (appBridgeReact as any).Provider || (appBridgeReact as any).default;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Shopify CDNを完全に使わず、Custom Elementsを手動登録
    if (!window.customElements.get("s-app-nav")) {
      customElements.define("s-app-nav", class extends HTMLElement {});
    }
    if (!window.customElements.get("s-nav-menu")) {
      customElements.define("s-nav-menu", class extends HTMLElement {});
    }
    if (!window.customElements.get("s-nav-menu-item")) {
      customElements.define("s-nav-menu-item", class extends HTMLElement {});
    }

    console.log("✅ Custom Web Components registered manually (no Shopify CDN)");

    // host取得
    const params = new URLSearchParams(window.location.search);
    const h = params.get("host");
    if (h) {
      sessionStorage.setItem("shopify-host", h);
      setHost(h);
    } else {
      setHost(sessionStorage.getItem("shopify-host"));
    }
  }, []);

  if (!host) return null;

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
