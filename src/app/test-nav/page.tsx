git add src/app/test-nav/page.tsx
git commit -m "fix: /test-nav ページから fetchCache/revalidate を削除して dynamic のみに統一"
git push
// src/app/test-nav/page.tsx
"use client";

// ✅ 静的プリレンダリングを禁止
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;


import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { NavigationMenu } from "@shopify/app-bridge/actions";

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
      console.log("🟢 NavigationMenu dispatch (相対パス /dashboard 形式)");
    }, 800);

    return () => navMenu.unsubscribe();
  }, [app]);

  return (
    <main>
      <h1>サイドナビテストページ</h1>
      <p>相対パス形式で NavigationMenu を dispatch しています。</p>
    </main>
  );
}
