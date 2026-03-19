// src/app/layout.tsx
"use client";

import "./globals.css";
import AppBridgeProvider from "@/lib/AppBridgeProvider";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    console.log("🟢 RootLayout initialized");
  }, []);

  return (
    <html lang="ja">
      <body>
        <AppBridgeProvider>{children}</AppBridgeProvider>
      </body>
    </html>
  );
}
