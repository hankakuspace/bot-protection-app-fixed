// src/components/AppBridgeProvider.tsx
"use client";

import React, { ReactNode } from "react";
import { Provider } from "@shopify/app-bridge-react/context";

interface Props {
  children: ReactNode;
  host: string;
}

export default function AppBridgeProvider({ children, host }: Props) {
  if (!host) return <>{children}</>;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
    host,
    forceRedirect: true,
  };

  return <Provider config={config}>{children}</Provider>;
}
