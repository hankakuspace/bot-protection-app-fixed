// src/components/AppBridgeProvider.tsx
"use client";

import React, { ReactNode, useMemo } from "react";
import createApp from "@shopify/app-bridge";

interface Props {
  children: ReactNode;
  host: string;
}

export default function AppBridgeProvider({ children, host }: Props) {
  const app = useMemo(() => {
    return createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host,
      forceRedirect: true,
    });
  }, [host]);

  // 子コンポーネントには context 経由で渡すのがベストだが、
  // まずはラッパーとして機能させるため children をそのまま返す
  return <>{children}</>;
}
