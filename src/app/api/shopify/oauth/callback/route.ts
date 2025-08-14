import { NextResponse } from "next/server";
import crypto from "crypto";

const API_KEY = process.env.SHOPIFY_API_KEY || "";
// APP or API どちらの名前でも拾えるように
const APP_SECRET =
  process.env.SHOPIFY_APP_SECRET || process.env.SHOPIFY_API_SECRET || "";
const APP_URL = process.env.SHOPIFY_APP_URL || "https://bot-protection-ten.vercel.app";

// ── 生クエリ文字列でHMACを検証（再エンコード差を排除）
function verifyOAuthHmacRaw(url: URL, secret: string) {
  const raw = url.search.startsWith("?") ? url.search.slice(1) : url.search;
  const pairs = raw
    .split("&")
    .filter((kv) => !/^hmac=/i.test(kv) && !/^signature=/i.test(kv));
  pairs.sort((a, b) => {
    const ak = a.split("=")[0], bk = b.split("=")[0];
    if (ak < bk) return -1;
    if (ak > bk) return 1;
    const av = a.slice(ak.length + 1), bv = b.slice(bk.length + 1);
    return av < bv ? -1 : av > bv ? 1 : 0;
  });
  const message = pairs.join("&");
  const digest = crypto.createHmac("sha256", secret).update(message, "utf8").digest("hex");
  const provided = new URLSearchParams(raw).get("hmac") || "";
  const ok =
    provided.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(digest));
  return { ok, provided, digest, message };
}

export async function GET(req: Request) {
  if (!API_KEY || !APP_SECRET) {
    return NextResponse.json({ ok: false, error: "missing env(API_KEY/SECRET)" }, { status: 500 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;
  const shop = (sp.get("shop") || "").toLowerCase();
  const state = sp.get("state") || "";
  const cookieState = req.headers.get("cookie")?.match(/(?:^|;\s*)shopify_state=([^;]+)/)?.[1] || "";

  // state 無い/不一致 → /start に戻す（配布リンク直押しにも対応）
  if (!state || !cookieState || state !== cookieState) {
    if (shop.endsWith(".myshopify.com")) {
      const u = new URL("/api/shopify/oauth/start", APP_URL);
      u.searchParams.set("shop", shop);
      return NextResponse.redirect(u.toString(), { status: 302 });
    }
    return NextResponse.json({ ok: false, error: "invalid state" }, { status: 400 });
  }

  const { ok, provided, digest, message } = verifyOAuthHmacRaw(url, APP_SECRET);
  if (!ok) {
    console.error("OAUTH_HMAC_FAIL", { provided, digest, message });
    return NextResponse.json({ ok: false, error: "invalid hmac" }, { status: 401 });
  }

  // ✅ 成功時はアプリ一覧へリダイレクト
  return NextResponse.redirect(`https://${shop}/admin/apps`, { status: 302 });
}
