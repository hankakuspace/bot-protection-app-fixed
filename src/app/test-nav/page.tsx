// src/app/test-nav/page.tsx
"use client";

import { AppBridgeProvider } from "../../lib/AppBridgeProvider";

export default function TestNavPage() {
  return (
    <AppBridgeProvider>
      {/* ✅ <ui-nav-menu> を文字列として出力することで型エラーを回避 */}
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <ui-nav-menu>
              <a href="/admin/dashboard">Dashboard</a>
              <a href="/admin/logs">Logs</a>
              <a href="/admin/admin-ip">Admin IP</a>
              <a href="/admin/block-ip">Block IP</a>
            </ui-nav-menu>
          `,
        }}
      />
    </AppBridgeProvider>
  );
}
