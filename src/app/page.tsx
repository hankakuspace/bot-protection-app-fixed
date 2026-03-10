"use client";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <nav style={{ marginBottom: "1.5rem" }}>
        <ul
          style={{
            display: "flex",
            gap: "1rem",
            listStyle: "none",
            padding: 0,
            margin: 0,
            flexWrap: "wrap",
          }}
        >
          <li>
            <a href="/admin/logs">アクセスログ</a>
          </li>
          <li>
            <a href="/admin/list-ip">ブロック設定</a>
          </li>
          <li>
            <a href="/admin/add-ip">IP追加</a>
          </li>
          <li>
            <a href="/blocked">Blockedページ</a>
          </li>
        </ul>
      </nav>

      <h1>Bot Guard MAN</h1>
      <p>
        Shopify Admin iframe 内でも、通常ブラウザ直アクセスでも表示できます。
      </p>
    </main>
  );
}
