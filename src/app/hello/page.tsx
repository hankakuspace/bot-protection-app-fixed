export default function Page() {
  return (
    <main style={{fontFamily:'system-ui', padding:'32px'}}>
      <h1>App Hello 👋</h1>
      <ol>
        <li><a href="/api/auth?shop=ruhra-store.myshopify.com&dry=1">/api/auth?shop=...&dry=1（中身を見る）</a></li>
        <li><a href="/api/auth?shop=ruhra-store.myshopify.com">/api/auth?shop=...（本番リダイレクト）</a></li>
        <li><a href="/api/debug/echo?foo=bar">/api/debug/echo（受信ヘッダ可視化）</a></li>
      </ol>
    </main>
  );
}
