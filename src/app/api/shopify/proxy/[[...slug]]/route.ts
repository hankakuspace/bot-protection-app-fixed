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
    const v = params.getAll(k).join(","); // 同一キーは , で結合
    pairs.push(`${k}=${v}`);
  }
  pairs.sort(); // key 昇順
  const message = pairs.join(""); // 区切り無しで連結

  const calcHex = crypto.createHmac("sha256", secret).update(message).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHex, "hex"), Buffer.from(calcHex, "hex"));
  } catch {
    return false;
  }
}

/**
 * IPブロック判定
 * 優先順: x-forwarded-for(先頭) > cf-connecting-ip > x-real-ip
 * ブロック対象なら 403 を throw
 */
async function enforceIpBlock(req: Request) {
  const xfwd = req.headers.get("x-forwarded-for") || "";
  const candidates = [
    xfwd.split(",")[0]?.trim() || "",
    req.headers.get("cf-connecting-ip") || "",
    req.headers.get("x-real-ip") || "",
  ].filter(Boolean);

  const clientIp = candidates[0] || "";
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

  // HMAC OK → IPブロック判定
  try {
    await enforceIpBlock(req);
  } catch (res) {
    return res as Response; // 403をそのまま返す
  }

  // 以降は既存処理
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

  // HMAC OK → IPブロック判定
  try {
    await enforceIpBlock(req);
  } catch (res) {
    return res as Response;
  }

  // 以降は既存処理
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
