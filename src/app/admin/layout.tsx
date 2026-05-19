// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { AppProvider, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";

const adminMenuItems = [
  { label: "ダッシュボード", url: "/admin" },
  { label: "アクセスログ", url: "/admin/logs" },
  { label: "ブロックIP一覧", url: "/admin/list-ip" },
  { label: "ブロックIP追加", url: "/admin/add-ip" },
  { label: "ブロック設定", url: "/admin/block-settings" },
  { label: "料金プラン", url: "/admin/billing" },
  { label: "プラン設定", url: "/admin/plan" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [host, setHost] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";

  useEffect(() => {
    (
      window as Window & { ShopifyAppBridgeWebComponents?: string }
    ).ShopifyAppBridgeWebComponents = "disabled";

    const params = new URLSearchParams(window.location.search);
    const hostFromQuery = params.get("host") || "";
    const hostFromStorage = sessionStorage.getItem("shopify-host") || "";
    const resolvedHost = hostFromQuery || hostFromStorage || "";

    if (hostFromQuery) {
      sessionStorage.setItem("shopify-host", hostFromQuery);
    }

    setHost(resolvedHost);
    setCurrentPath(window.location.pathname);
    setIsReady(true);

    console.log(
      "✅ AppBridge v3 active - forced disable of Shopify WebComponents loader",
    );
  }, []);

  if (!isReady) {
    return <div style={{ padding: "2rem" }}>⌛ Admin layout 初期化中...</div>;
  }

  const content = (
    <AppProvider>
      <Frame>
        <div className="min-h-screen bg-[#f6f8fb]">
          <header className="border-b border-[#e5e7eb] bg-white">
            <div className="flex w-full flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between xl:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
                  Store Access Guard
                </p>
                <h1 className="mt-1 text-lg font-semibold text-[#111827]">
                  管理画面
                </h1>
              </div>

              <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {adminMenuItems.map((item) => {
                  const isActive =
                    item.url === "/admin"
                      ? currentPath === "/admin"
                      : currentPath.startsWith(item.url);

                  return (
                    <a
                      key={item.url}
                      href={item.url}
                      className={[
                        "rounded-lg px-3 py-2 transition",
                        isActive
                          ? "bg-[#111827] text-white"
                          : "text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111827]",
                      ].join(" ")}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </header>

          {children}
        </div>
      </Frame>
    </AppProvider>
  );

  if (!apiKey || !host) {
    console.warn("AdminLayout: App Bridge disabled on direct access", {
      hasApiKey: Boolean(apiKey),
      hasHost: Boolean(host),
    });

    return content;
  }

  return (
    <AppBridgeProvider
      config={{
        apiKey,
        host,
        forceRedirect: true,
      }}
    >
      {content}
    </AppBridgeProvider>
  );
}
