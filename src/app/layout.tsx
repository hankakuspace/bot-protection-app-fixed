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
  return (
    <html lang="ja">
      <body>
        <AppBridgeProvider>
          <NavMenu />
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
