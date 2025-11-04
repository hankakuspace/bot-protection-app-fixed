// src/app/layout.tsx
"use client";

import AppBridgeProvider from "@/lib/AppBridgeProvider";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    console.log("🟢 Shopify Web Components loader initialized");
  }, []);

  return (
    <html lang="ja">
      <body>
        {/* ✅ 実在する安定バージョン */}
        <script
          type="module"
          src="https://cdn.shopify.com/shopifycloud/app-bridge-web-components/1.0.11/loader.js"
        ></script>

        <AppBridgeProvider>{children}</AppBridgeProvider>
      </body>
    </html>
  );
}
