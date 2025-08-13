// src/app/installed/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function Installed() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
      <h1>Installed 🎉</h1>
      <p>アプリのインストールが完了しました。</p>
      <ul>
        <li><a href="/hello">/hello に戻る</a></li>
        <li><a href="/auth-start?shop=ruhra-store.myshopify.com">再テスト（/auth-start）</a></li>
      </ul>
    </main>
  );
}
