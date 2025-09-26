// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head />
      <body>
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
