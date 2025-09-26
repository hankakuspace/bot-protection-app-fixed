// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* ✅ Shopify Web Components を有効化 */}
        <script
          type="module"
          src="https://unpkg.com/@shopify/app-bridge-web-components"
        ></script>
      </Head>
      <body>
        {/* ✅ TypeScriptの型エラーを避けるために dangerouslySetInnerHTML を利用 */}
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <ui-nav-menu>
                <a href="/admin/dashboard">ダッシュボード</a>
                <a href="/admin/logs">アクセスログ</a>
                <a href="/admin/admin-ip">管理者設定</a>
                <a href="/admin/block-ip">ブロック設定</a>
              </ui-nav-menu>
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
