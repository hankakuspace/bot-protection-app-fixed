// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Provider } from "@shopify/app-bridge-react";

export const metadata: Metadata = {
  title: "Bot Guard MAN",
  description: "Shopify bot protection app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("🟢 RootLayout loaded");

  // host をクエリ or localStorage から復元
  let host =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("host") || ""
      : "";

  if (typeof window !== "undefined") {
    if (host) {
      localStorage.setItem("shopify_host", host);
    } else {
      host = localStorage.getItem("shopify_host") || "";
    }
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
    host: host,
    forceRedirect: true,
  };

  return (
    <html lang="ja">
      <head>
        {/* App Bridge 本体 */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      </head>
      <body>
        {/* ✅ 公式 Provider でラップ */}
        <Provider config={config}>{children}</Provider>
      </body>
    </html>
  );
}
