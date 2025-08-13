// src/app/auth-post-abs/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function Page() {
  const shop = "ruhra-store.myshopify.com";
  const action = "https://bot-protection-ten.vercel.app/api/auth-start"; // ← 絶対URL
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
      <h1>/auth-post-abs</h1>
      <p>絶対URLで /api/auth-start に POST します。</p>
      <form action={action} method="post" style={{ marginTop: 16 }}>
        <input type="hidden" name="shop" value={shop} />
        <button type="submit" style={{ padding: "8px 16px" }}>
          絶対URLに POST（state Cookie 発行→302）
        </button>
      </form>
      <p style={{marginTop:12}}>
        送信後は Shopify 認可画面 → インストール → /api/auth/callback(JSON) へ戻ります。
      </p>
    </main>
  );
}
