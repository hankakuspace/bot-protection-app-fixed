// src/app/test-nav/page.tsx
"use client";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { NavigationMenu } from "@shopify/app-bridge/actions";
import type { ClientApplication } from "@shopify/app-bridge";

export default function TestNav() {
  const app = useAppBridge();

  useEffect(() => {
    if (app) {
      // ✅ 引数は1つだけ、型は二段キャスト
      const nav = NavigationMenu.create(app as unknown as ClientApplication);
      nav.dispatch(NavigationMenu.Action.UPDATE, {
        items: [
          {
            label: "ダッシュボード",
            destination: "/apps/bot-protection-app/admin/dashboard",
          },
          {
            label: "ログ",
            destination: "/apps/bot-protection-app/admin/logs",
          },
          {
            label: "テストナビ",
            destination: "/apps/bot-protection-app/test-nav",
          },
        ],
      });
      console.log("✅ NavigationMenu dispatch 実行");
    }
  }, [app]);

  return (
    <main>
      <h1>サイドナビテストページ</h1>
      <p>このページを開いたときに NavigationMenu.dispatch が走ります。</p>
    </main>
  );
}
