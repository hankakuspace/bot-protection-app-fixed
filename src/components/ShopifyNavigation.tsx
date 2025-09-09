"use client";

import { useEffect } from "react";
import { NavigationMenu } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@/components/AppBridgeProvider";

export default function ShopifyNavigation() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    const items = [
      { label: "IP追加", destination: "/apps/bot-protection-proxy/admin/add-ip" },
      { label: "ブロックリスト一覧", destination: "/apps/bot-protection-proxy/admin/list-ip" },
      { label: "アクセスログ", destination: "/apps/bot-protection-proxy/admin/logs" },
    ] as any;

    console.log("✅ NavigationMenu items set", items);

    const navMenu = NavigationMenu.create(app, { items });

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
