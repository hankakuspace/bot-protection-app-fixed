// src/app/layout.tsx
import { headers } from "next/headers";
import "./globals.css";
import LogAccessClient from "@/components/LogAccessClient";
import AppNavigationMenu from "@/components/NavigationMenu";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let ip = "UNKNOWN";
  try {
    const h = await headers();
    ip = h.get("x-client-ip") || "UNKNOWN";
  } catch {
    ip = "UNKNOWN";
  }

  return (
    <html lang="ja">
      <head>
        <meta name="x-client-ip" content={ip} />
      </head>
      <body>
        {/* アクセスログ送信 */}
        <LogAccessClient ip={ip} />

        {/* Shopify App NavigationMenu */}
        <AppNavigationMenu />

        {/* 各ページ */}
        {children}
      </body>
    </html>
  );
}
