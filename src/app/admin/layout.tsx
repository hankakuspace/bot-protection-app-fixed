// src/app/admin/layout.tsx
"use client";

import "@shopify/polaris/build/esm/styles.css";
import { useEffect, useState } from "react";
import { AppProvider, Frame } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);
  const [loaderLoaded, setLoaderLoaded] = useState(false);

  useEffect(() => {
    // Shopify hostの取得
    const params = new URLSearchParams(window.location.search);
    const h = params.get("host");
    if (h) {
      sessionStorage.setItem("shopify-host", h);
      setHost(h);
    } else {
      setHost(sessionStorage.getItem("shopify-host"));
    }

    // Web Components loader.js のローカル読み込み
    const script = document.createElement("script");
    script.src = "/loader.js"; // ← public配下
    script.onload = () => {
      console.log("✅ Web Components loader initialized");
      setLoaderLoaded(true);
    };
    script.onerror = () => console.error("❌ Failed to load local loader.js");
    document.head.appendChild(script);
  }, []);

  if (!loaderLoaded) return null;

  // Fallback定義（Reactが未登録要素を解釈しないように）
  if (typeof window !== "undefined" && !window.customElements.get("s-app-nav")) {
    customElements.define("s-app-nav", class extends HTMLElement {});
  }

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
          {/* Shopify Web Componentsで左ナビ描画 */}
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
