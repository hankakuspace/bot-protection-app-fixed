// src/lib/admin-auth-fetch.ts
"use client";

import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge-utils/utilities/session-token";

let appBridgeApp:
  | ReturnType<typeof createApp>
  | null = null;
let appBridgeKey = "";

function getStoredHost(): string {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const hostFromQuery = params.get("host") || "";
  const hostFromStorage = window.sessionStorage.getItem("shopify-host") || "";

  if (hostFromQuery) {
    window.sessionStorage.setItem("shopify-host", hostFromQuery);
  }

  return hostFromQuery || hostFromStorage || "";
}

async function getAdminAuthorizationHeader(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";
  const host = getStoredHost();

  if (!apiKey || !host) {
    return {};
  }

  const key = `${apiKey}:${host}`;

  if (!appBridgeApp || appBridgeKey !== key) {
    appBridgeApp = createApp({
      apiKey,
      host,
      forceRedirect: true,
    });
    appBridgeKey = key;
  }

  try {
    const token = await getSessionToken(appBridgeApp);

    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("Failed to get Shopify session token:", error);
    return {};
  }
}

export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const authHeaders = await getAdminAuthorizationHeader();
  const headers = new Headers(init.headers);

  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
