// src/app/layout.tsx
"use client";

import { useEffect } from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const sendUserAgent = async () => {
      try {
        await fetch("/api/log-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip: "unknown", // IP は middleware 側で取得済み
            isAdmin: false,
            userAgent: navigator.userAgent, // ✅ 本物のブラウザUAを送信
          }),
        });
      } catch (err) {
        console.error("client log-access failed", err);
      }
    };

    sendUserAgent();
  }, []);

  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
