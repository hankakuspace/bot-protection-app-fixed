// src/app/layout.tsx
"use client";

import "./globals.css";
import AppBridgeProvider from "@/lib/AppBridgeProvider";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") === true;
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";

  useEffect(() => {
    console.log("🟢 RootLayout initialized");
  }, []);

  return (
    <html lang="ja">
      <head>
        {isAdminRoute && apiKey ? (
          <>
            <meta name="shopify-api-key" content={apiKey} />
            <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
          </>
        ) : null}
      </head>
      <body>
        {isAdminRoute ? (
          <AppBridgeProvider>{children}</AppBridgeProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
