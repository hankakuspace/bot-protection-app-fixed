// src/components/ClientProviders.tsx
"use client";

import { useEffect, useState } from "react";
import AppBridgeProvider from "@/components/AppBridgeProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHost(params.get("host") || "");
  }, []);

  if (!host) {
    return <div>アプリを読み込み中...(host パラメータ未検出)</div>;
  }

  return <AppBridgeProvider>{children}</AppBridgeProvider>;
}
