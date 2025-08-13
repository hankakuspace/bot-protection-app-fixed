// src/app/auth-begin/page.tsx
import { cookies as getCookies, headers as getHeaders } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export default async function Page({
  searchParams,
}: {
  // Next 15: searchParams は Promise で渡される
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const shop = (sp.shop as string) ?? "";
  const apiKey = (process.env.SHOPIFY_API_KEY || "").trim();
  const scopes = (process.env.SHOPIFY_SCOPES || "").trim();

  // Server Action: state Cookie を発行→Shopify authorize に 302
  async function startOAuth(formData: FormData) {
    "use server";

    const shopFromForm = String(formData.get("shop") || "").trim();
    if (!shopFromForm.endsWith(".myshopify.com")) {
      return redirect("/auth-begin?error=invalid_shop");
    }
    if (!apiKey) {
      return redirect("/auth-begin?error=missing_api_key");
    }

    // ← ここを await に変更（Next 15 の Server Action では Promise）
    const h = await getHeaders();
    const proto = h.get("x-forwarded-proto") || "https";
    const host = h.get("host") || "";
    const origin = `${proto}://${host}`;
    const redirectUri = `${origin}/api/auth/callback`;

    const state = crypto.randomUUID();

    // cookies() も await で安全
    const ck = await getCookies();
    ck.set("shopify_state", state, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 600,
    });

    const u = new URL(`https://${shopFromForm}/admin/oauth/authorize`);
    u.searchParams.set("client_id", apiKey);
    if (scopes) u.searchParams.set("scope", scopes);
    u.searchParams.set("redirect_uri", redirectUri);
    u.searchParams.set("state", state);

    redirect(u.toString()); // Shopify 認可へ 302
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
      <h1>/auth-begin</h1>
      <p>Server Action 経由で state Cookie を発行し、Shopify 認可へ遷移します。</p>

      <form action={startOAuth} method="post" style={{ marginTop: 16 }}>
        <label>
          shop:&nbsp;
          <input
            name="shop"
            defaultValue={shop || "ruhra-store.myshopify.com"}
            style={{ padding: 6, minWidth: 360 }}
          />
        </label>
        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ padding: "8px 16px" }}>
            OAuth を開始（Server Action）
          </button>
          <a href="/hello" style={{ marginLeft: 12 }}>← back to /hello</a>
        </div>
      </form>

      <dl style={{ marginTop: 24 }}>
        <dt>env SHOPIFY_API_KEY</dt><dd>{apiKey ? "OK" : "(missing)"}</dd>
        <dt>env SHOPIFY_SCOPES</dt><dd>{scopes || "(empty)"} </dd>
      </dl>
    </main>
  );
}
