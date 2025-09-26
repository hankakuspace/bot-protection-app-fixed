// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function NavMenu() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) {
      console.warn("⚠️ AppBridge が初期化されていません");
      return;
    }

    const navMenu = NavigationMenu.create(app);

    navMenu.dispatch(NavigationMenu.Action.UPDATE, {
      items: [
        {
          label: "ダッシュボード",
          destination: "https://bot-protection-ten.vercel.app/admin/dashboard",
        },
        {
          label: "アクセスログ",
          destination: "https://bot-protection-ten.vercel.app/admin/logs",
        },
        {
          label: "管理者設定",
          destination: "https://bot-protection-ten.vercel.app/admin/admin-ip",
        },
        {
          label: "ブロック設定",
          destination: "https://bot-protection-ten.vercel.app/admin/block-ip",
        },
      ],
    });

    console.log("🟢 NavigationMenu dispatch 完了");

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return null;
}
