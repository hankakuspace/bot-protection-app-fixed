// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AppBridgeProvider } from "@/lib/AppBridgeProvider";
import NavMenu from "@/components/NavMenu";

export const metadata: Metadata = {
  title: "Bot Guard MAN",
  description: "Shopify bot protection app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("🟢 RootLayout loaded");

  return (
    <html lang="ja">
      <body>
        <AppBridgeProvider>
          {/* ✅ 全ページ共通で NavigationMenu を初期化 */}
          <NavMenu />
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
