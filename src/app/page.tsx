// src/app/page.tsx
"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    console.log("🟢 s-app-nav rendering...");
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      {/* ✅ Shopify 新仕様ナビゲーション（App Bridge Web Components） */}
      <s-app-nav>
        <s-link href="/apps/bot-protection-proxy/dashboard" slot="item">
          ダッシュボード
        </s-link>
        <s-link href="/apps/bot-protection-proxy/admin/logs" slot="item">
          アクセスログ
        </s-link>
        <s-link href="/apps/bot-protection-proxy/admin/settings" slot="item">
          管理者設定
        </s-link>
        <s-link href="/apps/bot-protection-proxy/admin/list-ip" slot="item">
          ブロック設定
        </s-link>
      </s-app-nav>

      <h1>Bot Guard MAN</h1>
      <p>Shopify Admin iframe 内で動作しています。</p>
    </main>
  );
}
