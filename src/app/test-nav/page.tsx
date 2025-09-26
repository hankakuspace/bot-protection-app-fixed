// src/app/test-nav/page.tsx
"use client";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { NavigationMenu } from "@shopify/app-bridge/actions";

export default function TestNav() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) {
      console.warn("⚠️ AppBridge 未初期化。NavigationMenu を作成できません");
      return;
    }

    let navMenu: any;
    try {
      navMenu = (NavigationMenu as any).create(app);
    } catch (err) {
      console.error("❌ NavigationMenu.create 失敗", err);
      return;
    }

    const timer = setTimeout(() => {
      try {
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
      } catch (err) {
        console.error("❌ NavigationMenu.dispatch 失敗", err);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      if (navMenu && typeof navMenu.unsubscribe === "function") {
        navMenu.unsubscribe();
      }
    };
  }, [app]);

  return (
    <main>
      <h1>サイドナビテストページ</h1>
      <p>NavigationMenu.dispatch が正常に呼ばれると、左サイドバーにメニューが出ます。</p>
    </main>
  );
}
