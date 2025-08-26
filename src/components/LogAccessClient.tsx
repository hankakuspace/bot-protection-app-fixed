// src/components/LogAccessClient.tsx
"use client";

import { useEffect } from "react";

export default function LogAccessClient({ ip }: { ip: string }) {
  useEffect(() => {
    const logAccess = async () => {
      try {
        const ua =
          (navigator as any).userAgent ||
          (navigator as any).userAgentData?.brands
            ?.map((b: any) => `${b.brand}/${b.version}`)
            .join(", ") ||
          "UNKNOWN";

        await fetch("/api/log-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip,
            isAdmin: false,
            userAgent: ua, // ✅ UAを確実に送信
            clientTime: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("client log-access failed", err);
      }
    };

    // ✅ 初回マウント時に必ず送信（ip が UNKNOWN でも送る）
    logAccess();
  }, []); // ← ip依存を外した

  return null;
}
