// src/app/auth-post-abs/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function Page() {
  const shop = "ruhra-store.myshopify.com";
  const action = "https://bot-protection-ten.vercel.app/api/auth-start"; // サーバの絶対URL

  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>/auth-post-abs</h1>
      <p>絶対URLで /api/auth-start に POST して state Cookie を発行 → Shopify 認可へ</p>
      <form action={action} method="post">
        <input type="hidden" name="shop" value={shop} />
        <button type="submit" style={{ padding: "8px 16px" }}>
          OAuth 開始（サーバ経由）
        </button>
      </form>
    </main>
  );
}
