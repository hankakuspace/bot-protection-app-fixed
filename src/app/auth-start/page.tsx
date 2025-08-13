"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

// ← 事前レンダリングを避ける（このページは動的に評価させる）
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function AuthStartInner() {
  const sp = useSearchParams();
  const shop = sp.get("shop") ?? "";

  const { origin, redirectUri, authorizeUrl, problems } = useMemo(() => {
    const out = { origin: "", redirectUri: "", authorizeUrl: "", problems: [] as string[] };
    try {
      out.origin = typeof window !== "undefined" ? window.location.origin : "";
      if (!shop?.endsWith(".myshopify.com")) out.problems.push("invalid shop");
      if (!out.origin) out.problems.push("no window.origin");
      if (out.origin && shop) {
        out.redirectUri = `${out.origin}/api/auth/callback`;
        const u = new URL(`https://${shop}/admin/oauth/authorize`);
        const state = "debug-" + Math.random().toString(36).slice(2);
        u.searchParams.set("client_id", process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? "");
        u.searchParams.set("scope", process.env.NEXT_PUBLIC_SHOPIFY_SCOPES ?? "");
        u.searchParams.set("redirect_uri", out.redirectUri);
        u.searchParams.set("state", state);
        out.authorizeUrl = u.toString();
      }
    } catch (e) { out.problems.push(String(e)); }
    return out;
  }, [shop]);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
      <h1>/auth-start (page)</h1>
      <ul>
        <li><b>shop:</b> {shop || "(missing)"}</li>
        <li><b>origin:</b> {origin}</li>
        <li><b>redirectUri:</b> {redirectUri}</li>
        <li style={{wordBreak:"break-all"}}><b>authorize:</b> {authorizeUrl}</li>
      </ul>
      {problems.length > 0 && (
        <div style={{ color: "crimson" }}>
          <b>problems:</b>
          <ul>{problems.map((p,i)=><li key={i}>{p}</li>)}</ul>
        </div>
      )}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <a href="/hello">← back to /hello</a>
        <button
          onClick={() => { if (authorizeUrl) window.location.href = authorizeUrl; }}
          disabled={!authorizeUrl}
          style={{ padding: "8px 16px" }}
        >
          1クリックで OAuth 開始（authorize へ遷移）
        </button>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main style={{padding:24}}>Loading…</main>}>
      <AuthStartInner />
    </Suspense>
  );
}
