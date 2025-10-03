// src/app/test-nav/page.tsx
"use client";

import { NavigationMenu } from "@shopify/app-bridge-react";

export default function TestNavPage() {
  return (
    <main>
      <h1>Test NavigationMenu (React版)</h1>
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
