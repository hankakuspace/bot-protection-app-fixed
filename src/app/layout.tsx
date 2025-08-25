// src/app/layout.tsx
"use client";
import { useEffect } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const logAccess = async () => {
      try {
        const res = await fetch("/", { method: "HEAD" }); // middleware が動く
        const ip = res.headers.get("x-client-ip") || "unknown";

        await fetch("/api/log-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip,
            isAdmin: false,
            userAgent: navigator.userAgent, // ✅ 本物のUA
          }),
        });
      } catch (err) {
        console.error("client log-access failed", err);
      }
    };

    logAccess();
  }, []);

  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
