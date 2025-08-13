// ページ版: /auth-start?shop=<shop>.myshopify.com
// 何もリダイレクトしません。画面に authorize/redirectUri を表示し、ボタンで手動開始します。
"use client";

import { useMemo } from "react";

export default function AuthStartPage({
  searchParams,
}: { searchParams: Record<string, string|undefined> }) {
  const shop = searchParams.shop ?? "";

  const { origin, redirectUri, authorizeUrl, problems } = useMemo(() => {
    const out = { origin: "", redirectUri: "", authorizeUrl: "", problems: [] as string[] };
    try {
      // window.origin を使えば環境変数やNodeの層を踏まずに算出できます
      out.origin = typeof window !== "undefined" ? window.location.origin : "";
      if (!shop.endsWith(".myshopify.com")) out.problems.push("invalid shop");
      if (!out.origin) out.problems.push("no window.origin");
      if (out.origin) {
        out.redirectUri = `${out.origin}/api/auth/callback`;
        const u = new URL(`https://${shop}/admin/oauth/authorize`);
        const state = "debug-" + Math.random().toString(36).slice(2);
        u.searchParams.set("client_id", process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? "");
        u.searchParams.set("scope", process.env.NEXT_PUBLIC_SHOPIFY_SCOPES ?? "");
        u.searchParams.set("redirect_uri", out.redirectUri);
        u.searchParams.set("state", state);
        out.authorizeUrl = u.toString();
      }
    } catch (e) {
      out.problems.push(String(e));
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
      <h1>/auth-start (page)</h1>
      <p>※ ここは <b>APIを使わず</b>にauthorize URLを計算して表示するページです。</p>
      <ul>
        <li><b>shop:</b> {shop || "(missing)"} </li>
        <li><b>origin:</b> {origin}</li>
        <li><b>redirectUri:</b> {redirectUri}</li>
        <li style={{ wordBreak: "break-all" }}><b>authorize:</b> {authorizeUrl}</li>
      </ul>

      {problems.length > 0 && (
        <div style={{ color: "crimson" }}>
          <b>problems:</b>
          <ul>{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <a href="/hello">← back to /hello</a>
        <a href={`/auth-start?shop=${encodeURIComponent(shop || "")}`} onClick={(e) => { if (!shop) e.preventDefault(); }} style={{ opacity: 0.6 }}>
          reload
        </a>
        <button
          onClick={() => { if (authorizeUrl) window.location.href = authorizeUrl; }}
          disabled={!authorizeUrl}
          style={{ padding: "8px 16px" }}
        >
          1クリックで OAuth 開始（authorize へ遷移）
        </button>
      </div>

      <hr style={{ margin: "24px 0" }} />
      <p>もしこのページでもリダイレクトエラーになるなら、<b>Next.js/ Vercel のリダイレクト設定</b>が原因です。</p>
    </main>
  );
}
