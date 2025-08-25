// src/app/layout.tsx
import { headers } from "next/headers";
import "./globals.css";
import LogAccessClient from "@/components/LogAccessClient";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ip = headers().get("x-client-ip") || "UNKNOWN";

  return (
    <html lang="ja">
      <head>
        <meta name="x-client-ip" content={ip} />
      </head>
      <body>
        {/* クライアント側でアクセスログ送信 */}
        <LogAccessClient ip={ip} />
        {children}
      </body>
    </html>
  );
}
