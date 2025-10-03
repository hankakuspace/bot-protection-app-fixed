// src/app/test-nav/page.tsx
"use client";

import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { NavigationMenu } from "@shopify/app-bridge/actions";

// ✅ 静的生成を完全に無効化
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function TestNav() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    const navMenu = (NavigationMenu as any).create(app);

    setTimeout(() => {
      navMenu.dispatch(NavigationMenu.Action.UPDATE, {
        items: [
          { label: "ダッシュボード", destination: "/dashboard" },
          { label: "アクセスログ", destination: "/logs" },
          { label: "管理者設定", destination: "/admin-ip" },
          { label: "ブロック設定", destination: "/block-ip" },
        ],
      });
      console.log("🟢 NavigationMenu dispatch 実行");
    }, 500);
  }, [app]);

  return (
    <main>
      <h1>TestNav</h1>
      <p>NavigationMenu attach のテストページ</p>
    </main>
  );
}
