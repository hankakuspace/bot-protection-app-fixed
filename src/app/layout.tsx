// src/app/layout.tsx
import { headers } from "next/headers";
import "./globals.css";
import { useEffect } from "react";

// ⬇️ Client Component をトップレベルで定義
function LogAccessClient({ ip }: { ip: string }) {
  "use client";

  useEffect(() => {
    const logAccess = async () => {
      try {
        await fetch("/api/log-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip,
            isAdmin: false,
            userAgent: navigator.userAgent,
            clientTime: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("client log-access failed", err);
      }
    };
    logAccess();
  }, [ip]);

  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ip = headers().get("x-client-ip") || "UNKNOWN";

  return (
    <html lang="ja">
      <head>
        <meta name="x-client-ip" content={ip} />
      </head>
      <body>
        <LogAccessClient ip={ip} />
        {children}
      </body>
    </html>
  );
}
