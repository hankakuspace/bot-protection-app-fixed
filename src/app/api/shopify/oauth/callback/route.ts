import { NextResponse } from "next/server";
import crypto from "crypto";

// OAuth用HMAC検証（App Proxyとは別ルール：&で連結）
function verifyOAuthHmac(url: URL, appSecret: string) {
  const params = new URLSearchParams(url.search);
  const hmac = params.get("hmac") || "";
  params.delete("hmac");
  params.delete("signature"); // 念のため
  const message = Array.from(params.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const digest = crypto.createHmac("sha256", appSecret).update(message, "utf8").digest("hex");
  return { ok: hmac && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(digest)), digest };
}

const API_KEY = process.env.SHOPIFY_API_KEY || "";
const APP_SECRET = process.env.SHOPIFY_APP_SECRET || "";
const APP_URL = process.env.SHOPIFY_APP_URL || "";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const shop = (sp.get("shop") || "").toLowerCase();
  const state = sp.get("state") || "";
  const cookieState = req.headers.get("cookie")?.match(/(?:^|;\s*)shopify_state=([^;]+)/)?.[1] || "";

  if (!API_KEY || !APP_SECRET || !APP_URL) {
    return NextResponse.json({ ok: false, error: "missing env(API_KEY/SECRET/APP_URL)" }, { status: 500 });
  }
  if (!shop.endsWith(".myshopify.com")) {
    return NextResponse.json({ ok: false, error: "invalid shop" }, { status: 400 });
  }
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.json({ ok: false, error: "invalid state" }, { status: 400 });
  }

  const { ok } = verifyOAuthHmac(url, APP_SECRET);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "invalid hmac" }, { status: 401 });
  }

  // ここでアクセストークン交換を行わない＝Admin APIを使わない前提の“最小インストール完了”
  // 完了画面を返す（必要なら /installed にリダイレクトでもOK）
  const html = `<!doctype html><meta charset="utf-8">
  <style>body{font:14px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto}</style>
  <h1>bot-protection-proxy: Installation Succeeded ✅</h1>
  <p>Shop: ${shop}</p>
  <p><a href="https://${shop}/admin/apps">Back to Apps</a></p>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
