// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (window.customElements.get("s-app-nav")) {
        console.log("✅ s-app-nav ready");
        clearInterval(timer);
        setReady(true);
      }
    }, 300);
    return () => clearInterval(timer);
  }, []);

  if (!ready) return <p style={{ padding: "2rem" }}>⌛ 初期化中...</p>;

  return (
    <main style={{ padding: "2rem" }}>
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <s-app-nav>
              <s-link href="/apps/bot-protection-proxy/dashboard" slot="item">ダッシュボード</s-link>
              <s-link href="/apps/bot-protection-proxy/admin/logs" slot="item">アクセスログ</s-link>
              <s-link href="/apps/bot-protection-proxy/admin/settings" slot="item">管理者設定</s-link>
              <s-link href="/apps/bot-protection-proxy/admin/list-ip" slot="item">ブロック設定</s-link>
            </s-app-nav>
          `,
        }}
      />

      <h1>Bot Guard MAN</h1>
      <p>Shopify Admin iframe 内で動作しています。</p>
    </main>
  );
}
