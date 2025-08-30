// src/app/admin/page.tsx
"use client";

import { NavigationMenu } from "@shopify/app-bridge-react";

export default function AdminHome() {
  return (
    <div>
      <NavigationMenu
        navigationLinks={[
          { label: "IP追加", destination: "/admin/add-ip" },
          { label: "ブロックリスト", destination: "/admin/list-ip" },
          { label: "アクセスログ", destination: "/admin/logs" },
        ]}
      />
      <h1 className="text-xl font-bold">管理画面トップ</h1>
    </div>
  );
}
