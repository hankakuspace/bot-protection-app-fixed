// src/app/test-nav/page.tsx
"use client";

import { useEffect } from "react";
import { NavigationMenu } from "@shopify/app-bridge-react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

export default function TestNavPage() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    console.log("🟢 TestNavPage mounted, app:", app);
  }, [app]);

  if (!app) {
    return <p>AppBridge が初期化されていません</p>;
  }

  return (
    <main>
      <h1>Test NavigationMenu (React版)</h1>

      {/* ✅ Reactコンポーネントでサイドナビを定義 */}
      <NavigationMenu
        navigationLinks={[
          { label: "ダッシュボード", destination: "/dashboard" },
          { label: "アクセスログ", destination: "/admin/logs" },
          { label: "管理者設定", destination: "/admin/settings" },
          { label: "ブロック設定", destination: "/admin/list-ip" },
        ]}
      />
    </main>
  );
}
