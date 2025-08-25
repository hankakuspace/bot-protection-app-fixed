// src/app/layout.tsx
import { headers } from "next/headers";
import { useEffect } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // middleware でセットされた x-client-ip を取得
  const ip = headers().get("x-client-ip") || "UNKNOWN";

  useEffect(() => {
    const logAccess = async () => {
      try {
        await fetch("/api/log-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip,
            isAdmin: false,
            userAgent: navigator.userAgent, // ✅ 本物のUA
            clientTime: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("client log-access failed", err);
      }
    };

    logAccess();
  }, [ip]);

  return (
    <html lang="ja">
      <head>
        <meta name="x-client-ip" content={ip} />
      </head>
      <body>{children}</body>
    </html>
  );
}
