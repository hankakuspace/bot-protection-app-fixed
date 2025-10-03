// src/app/layout.tsx
import { Provider } from "@shopify/app-bridge-react";

const config = {
  apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
  host: typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("host") || localStorage.getItem("shopify_host") || ""
    : "",
  forceRedirect: true,
};

<Provider config={config}>
  {children}
</Provider>
