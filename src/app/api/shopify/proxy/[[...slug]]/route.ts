import { NextResponse } from "next/server";
import crypto from "crypto";
import { listIps } from "@/lib/ipStore";

/**
 * Shopify App Proxy 署名検証（HMAC-SHA256）
 * - signature 以外の全クエリを key=value に変換（同一キーは値をカンマ結合）
 * - key 昇順で並べ、区切りなしで連結
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

/** 実クライアントIP解決（優先順：cf-connecting-ip → x-forwarded-for(先頭) → x-real-ip） */
function resolveClientIp(req: Request) {
  const cf = req.headers.get("cf-connecting-ip") || "";
  const xfwd = req.headers.get("x-forwarded-for") || "";
  const xri = req.headers.get("x-real-ip") || "";
  const candidates = [
    cf,
    xfwd.split(",")[0]?.trim() || "",
    xri,
  ].filter(Boolean);
  return candidates[0] || "";
}

/** IPブロック判定：一致したら 403 を返す Response を throw する */
async function enforceIpBlock(req: Request) {
  const clientIp = resolveClientIp(req);
  if (!clientIp) return; // 取得できない場合はスキップ

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
    return res as Response; // 403 をそのまま返す
  }

  // 以降は既存処理
  const slug: string[] = (params?.slug as string[]) ?? [];
  if (slug[0] === "ping") {
    const ip = resolveClientIp(req); // 検証しやすいよう一時的に同梱
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method: "GET",
      slug,
      ip,
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
    const ip = resolveClientIp(req); // 検証しやすいよう一時的に同梱
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method: "POST",
      slug,
      ip,
      body,
    });
  }

  return NextResponse.json({ ok: true, method: "POST", slug });
}
