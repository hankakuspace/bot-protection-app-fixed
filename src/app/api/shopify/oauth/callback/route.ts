import { NextResponse } from "next/server";
import crypto from "crypto";

const API_KEY = process.env.SHOPIFY_API_KEY || "";
// APP_SECRET は APP or API どちらの名前でも拾う
const APP_SECRET =
  process.env.SHOPIFY_APP_SECRET || process.env.SHOPIFY_API_SECRET || "";

function verifyOAuthHmacRaw(url: URL, secret: string) {
  const raw = url.search.startsWith("?") ? url.search.slice(1) : url.search;

  // hmac / signature を除外（デコードしない）
  const pairs = raw
    .split("&")
    .filter((kv) => !/^hmac=/i.test(kv) && !/^signature=/i.test(kv));

  // キーで昇順ソート（key=value の key 部分で比較）
  pairs.sort((a, b) => {
    const ak = a.split("=")[0];
    const bk = b.split("=")[0];
    return ak < bk ? -1 : ak > bk ? 1 : 0;
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
      const u = new URL("https://bot-protection-ten.vercel.app/api/shopify/oauth/start");
      u.searchParams.set("shop", shop);
      return NextResponse.redirect(u.toString(), { status: 302 });
    }
    return NextResponse.json({ ok: false, error: "invalid state" }, { status: 400 });
  }

  // ← ここを raw 方式に差し替え
  const { ok, provided, digest, message } = verifyOAuthHmacRaw(url, APP_SECRET);
  if (!ok) {
    // 失敗内容はログにのみ出す（レスポンスには出さない）
    console.error("OAUTH_HMAC_FAIL", { provided, digest, message });
    return NextResponse.json({ ok: false, error: "invalid hmac" }, { status: 401 });
  }

  const html = `<!doctype html><meta charset="utf-8">
  <style>body{font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto}</style>
  <h1>bot-protection-proxy: Installation Succeeded ✅</h1>
  <p>Shop: ${shop}</p>
  <p><a href="https://${shop}/admin/apps">Back to Apps</a></p>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
