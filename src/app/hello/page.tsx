export default function Page() {
  return (
    <main style={{fontFamily:'system-ui', padding:'32px'}}>
      <h1>App Hello 👋</h1>
      <p>このページは「App URL が正しく読み込まれているか」を確認するための診断ページです。</p>
      <p>
        次に、手動で OAuth を開始します：
        {' '}
        <a href="/api/auth?shop=ruhra-store.myshopify.com">/api/auth?shop=ruhra-store.myshopify.com</a>
      </p>
      <p>
        受信ヘッダ確認：
        {' '}
        <a href="/api/debug/echo?foo=bar">/api/debug/echo?foo=bar</a>
      </p>
    </main>
  );
}
