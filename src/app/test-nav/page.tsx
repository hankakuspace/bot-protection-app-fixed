// src/app/test-nav/page.tsx
"use client";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function TestNav() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    // ✅ 型エラーを避けるため any にキャスト
    const navMenu = (NavigationMenu as any).create(app);

    setTimeout(() => {
      navMenu.dispatch(NavigationMenu.Action.UPDATE, {
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
      console.log("🟢 NavigationMenu dispatch 実行 (/apps/... 形式)");
    }, 500);

    return () => {
      navMenu.unsubscribe();
    };
  }, [app]);

  return (
    <main>
      <h1>サイドナビテストページ</h1>
      <p>NavigationMenu.dispatch が iframe 内で attach されるか確認してください。</p>
    </main>
  );
}
