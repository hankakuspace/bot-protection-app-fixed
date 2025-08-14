import { NextResponse } from "next/server";
import crypto from "crypto";
import { listIps } from "@/lib/ipStore";

/**
 * Shopify App Proxy 署名検証（HMAC-SHA256）
 * - signature以外の全クエリを key=value に変換（同一キーは値をカンマ結合）
 * - key昇順で並べ、区切りなしで連結
 * - secret で HMAC-SHA256 → hex を比較
 */
function verifyProxySignature(query: URLSearchParams, secret: string) {
  if (!secret) return false;

  const params = new URLSearchParams(query);
  const signatureHex = params.get("signature") || "";
  params.delete("signature");

  const keys = Array.from(new Set(Array.from(params.keys())));
  const pairs: string[] = [];
  for (const k of keys) {
    const v = params.getAll(k).join(",");
    pairs.push(`${k}=${v}`);
  }
  pairs.sort();
  const message = pairs.join("");

  const calcHex = crypto.createHmac("sha256", secret).update(message).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHex, "hex"), Buffer.from(calcHex, "hex"));
  } catch {
    return false;
  }
}

/**
 * IPブロック判定（x-forwarded-for → cf-connecting-ip → x-real-ip）
 * 403時は Response を throw（呼び出し元でそのまま return）
 * ↓↓↓ 一時ログあり（検証後に削除してください）
 */
async function enforceIpBlock(req: Request) {
  const xfwd = req.headers.get("x-forwarded-for") || "";
  const candidates = [
    xfwd.split(",")[0]?.trim() || "",
    req.headers.get("cf-connecting-ip") || "",
    req.headers.get("x-real-ip") || "",
  ].filter(Boolean);

  const clientIp = candidates[0] || "";

  // ===== ▼▼▼ 一時ログ（検証後に削除）▼▼▼ =====
  console.log("[proxy] XFWD:", xfwd);
  console.log("[proxy] CF:", req.headers.get("cf-connecting-ip"));
  console.log("[proxy] X-REAL-IP:", req.headers.get("x-real-ip"));
  console.log("[proxy] RESOLVED-IP:", clientIp);
  // ===== ▲▲▲ 一時ログ（検証後に削除）▲▲▲ =====

  if (!clientIp) return;

  const blocked = await listIps(); // 例: ["203.0.113.7", ...]
  if (blocked.includes(clientIp)) {
    throw new Response(
      JSON.stringify({ ok: false, error: "blocked ip", ip: clientIp }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET
export async function GET(req: Request, { params }: any) {
  const url = new URL(req.url);
  const query = url.searchParams;

  const secret = process.env.SHOPIFY_API_SECRET || "";
  if (!verifyProxySignature(query, secret)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  try {
    await enforceIpBlock(req);
  } catch (res) {
    return res as Response; // 403 をそのまま返す
  }

  const slug: string[] = (params?.slug as string[]) ?? [];
  if (slug[0] === "ping") {
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method: "GET",
      slug,
      query: Object.fromEntries(query.entries()),
    });
  }

  return NextResponse.json({ ok: true, method: "GET", slug });
}

// POST
export async function POST(req: Request, { params }: any) {
  const url = new URL(req.url);
  const query = url.searchParams;

  const secret = process.env.SHOPIFY_API_SECRET || "";
  if (!verifyProxySignature(query, secret)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  try {
    await enforceIpBlock(req);
  } catch (res) {
    return res as Response;
  }

  const slug: string[] = (params?.slug as string[]) ?? [];
  if (slug[0] === "ping") {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method: "POST",
      slug,
      body,
    });
  }

  return NextResponse.json({ ok: true, method: "POST", slug });
}
