// src/app/layout.tsx
"use client";

import "./globals.css";
import AppBridgeProvider from "@/lib/AppBridgeProvider";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") === true;

  useEffect(() => {
    console.log("🟢 RootLayout initialized");
  }, []);

  return (
    <html lang="ja">
      <body>
        {isAdminRoute ? (
          <>
            <Script
              src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
              strategy="beforeInteractive"
            />
            <AppBridgeProvider>{children}</AppBridgeProvider>
          </>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
