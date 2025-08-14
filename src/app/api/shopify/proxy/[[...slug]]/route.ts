import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { listIps } from "@/lib/ipStore"; // ← IPリスト取得

// Shopify App Proxy の署名検証（HMAC-SHA256）
function verifyProxySignature(query: URLSearchParams, secret: string) {
  const signature = query.get("signature") || "";
  const params = new URLSearchParams(query);
  params.delete("signature");

  const message = params.toString();
  const providedSignature = Buffer.from(signature, "hex");
  const hmac = crypto.createHmac("sha256", secret).update(message).digest();

  return crypto.timingSafeEqual(hmac, providedSignature);
}

// ★ IPブロック判定（x-forwarded-for → cf-connecting-ip → x-real-ip の順）
async function enforceIpBlock(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for") || "";
  const candidates = [
    xfwd.split(",")[0]?.trim() || "",
    req.headers.get("cf-connecting-ip") || "",
    req.headers.get("x-real-ip") || "",
  ].filter(Boolean);

  const clientIp = candidates[0] || "";
  if (!clientIp) return; // 取れない場合はスキップ

  const blocked = await listIps(); // 例: ["203.0.113.7", ...]
  if (blocked.includes(clientIp)) {
    throw new Response(
      JSON.stringify({ ok: false, error: "blocked ip", ip: clientIp }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET
export async function GET(
  req: NextRequest,
  ctx: { params: { slug: string[] } } // ← 必ず string[] 型（? 不可）
) {
  const url = new URL(req.url);
  const query = url.searchParams;

  const secret = process.env.SHOPIFY_API_SECRET || "";
  if (!verifyProxySignature(query, secret)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  // HMAC 検証 OK → IP ブロック判定
  try {
    await enforceIpBlock(req);
  } catch (res) {
    return res as Response; // 403 をそのまま返す
  }

  // 既存のハンドリング
  const slug = ctx.params.slug ?? [];
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
export async function POST(
  req: NextRequest,
  ctx: { params: { slug: string[] } } // ← 必ず string[] 型
) {
  const url = new URL(req.url);
  const query = url.searchParams;

  const secret = process.env.SHOPIFY_API_SECRET || "";
  if (!verifyProxySignature(query, secret)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  // HMAC 検証 OK → IP ブロック判定
  try {
    await enforceIpBlock(req);
  } catch (res) {
    return res as Response;
  }

  // 既存のハンドリング
  const slug = ctx.params.slug ?? [];
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
