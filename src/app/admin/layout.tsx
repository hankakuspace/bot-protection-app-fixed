// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { AppProvider, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);
  const [loaderReady, setLoaderReady] = useState(false);

  useEffect(() => {
    // hostの取得
    const params = new URLSearchParams(window.location.search);
    const h = params.get("host");
    if (h) {
      sessionStorage.setItem("shopify-host", h);
      setHost(h);
    } else {
      setHost(sessionStorage.getItem("shopify-host"));
    }

    // ✅ ローカル版 loader.js を明示的に読み込み
    const script = document.createElement("script");
    script.src = "/loader.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ Local loader.js loaded successfully");
      // ✅ 必ず定義を確認してからフラグを立てる
      if (window.customElements.get("s-app-nav")) {
        console.log("✅ Web Components registered");
      } else {
        console.log("⚠️ Registering custom elements manually");
        customElements.define("s-app-nav", class extends HTMLElement {});
        customElements.define("s-nav-menu", class extends HTMLElement {});
        customElements.define("s-nav-menu-item", class extends HTMLElement {});
      }
      setLoaderReady(true);
    };
    script.onerror = () => console.error("❌ Failed to load local loader.js");
    document.head.appendChild(script);
  }, []);

  if (!host || !loaderReady) return null;

  return (
    <AppBridgeProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host: host,
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
