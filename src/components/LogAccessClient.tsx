// src/components/LogAccessClient.tsx
"use client";

import { useEffect } from "react";

export default function LogAccessClient({ ip }: { ip: string }) {
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

  return null; // UI不要
}
