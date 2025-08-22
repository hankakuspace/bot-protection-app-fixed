// src/app/auth-post/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function Page() {
  const shop = "ruhra-store.myshopify.com";
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
      <h1>/auth-post</h1>
      <p>純粋な HTML フォームで /api/auth-start に POST します。</p>
      <form action="/api/auth-start" method="post" style={{ marginTop: 16 }}>
        <input type="hidden" name="shop" value={shop} />
        <button type="submit" style={{ padding: "8px 16px" }}>
          /api/auth-start に POST（state Cookie 発行→302）
        </button>
      </form>
      <p style={{marginTop:12}}>
        これで 404 になる場合は、ブラウザの送信先がズレています。<br/>
        次のページでも試せます：<br/>
        ・<a href={`/auth-post-abs`}>/auth-post-abs（絶対URL版）</a>
      </p>
    </main>
  );
}
