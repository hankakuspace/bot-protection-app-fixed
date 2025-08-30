"use client";

import { useEffect } from "react";
import { useAppBridge } from "./AppBridgeProvider";

export default function ShopifyNavigation() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    // Web Components API (ui-nav-menu) を使う
    const navMenu = (window as any).shopify?.ui?.navMenu;
    if (navMenu) {
      navMenu({
        items: [
          { label: "IP追加", destination: "/admin/add-ip" },
          { label: "ブロックリスト", destination: "/admin/list-ip" },
          { label: "アクセスログ", destination: "/admin/logs" },
        ],
      });
    }
  }, [app]);

  return null; // UIは不要、Shopify側にナビゲーションが追加される
}
