// src/app/layout.tsx
import { headers } from "next/headers";
import "./globals.css";
import LogAccessClient from "@/components/LogAccessClient";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // headers() が Promise 扱いされる場合に対応
  let ip = "UNKNOWN";
  try {
    const h = (headers() as any);
    ip = h.get?.("x-client-ip") || "UNKNOWN";
  } catch {
    ip = "UNKNOWN";
  }

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
