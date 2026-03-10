"use client";

import { Provider } from "@shopify/app-bridge-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  children: React.ReactNode;
};

export default function AppBridgeProvider({ children }: Props) {
  const [host, setHost] = useState("");
  const [isReady, setIsReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hostParam = params.get("host") || "";
    setHost(hostParam);
    setIsReady(true);
  }, []);

  const config = useMemo(() => {
    if (!apiKey || !host) {
      return null;
    }

    return {
      apiKey,
      host,
      forceRedirect: true,
    };
  }, [apiKey, host]);

  if (!isReady) {
    return <div style={{ padding: "2rem" }}>⌛ 初期化中...</div>;
  }

  if (!apiKey || !host || !config) {
    console.warn("App Bridge disabled: missing host or apiKey", {
      hasApiKey: Boolean(apiKey),
      hasHost: Boolean(host),
    });

    return <>{children}</>;
  }

  return <Provider config={config}>{children}</Provider>;
}
