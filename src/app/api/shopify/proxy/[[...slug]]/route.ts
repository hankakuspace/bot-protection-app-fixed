import { NextResponse } from "next/server";
import crypto from "crypto";
import { listIps } from "@/lib/ipStore";

// Shopify App Proxy 署名検証（HMAC-SHA256）
function verifyProxySignature(query: URLSearchParams, secret: string) {
  const signature = query.get("signature") || "";
  const params = new URLSearchParams(query);
  params.delete("signature");

  const message = params.toString();
  const providedSignature = Buffer.from(signature, "hex");
  const hmac = crypto.createHmac("sha256", secret).update(message).digest();

  return crypto.timingSafeEqual(hmac, providedSignature);
}

// IPブロック判定（x-forwarded-for → cf-connecting-ip → x-real-ip）
async function enforceIpBlock(req: Request) {
  const xfwd = req.headers.get("x-forwarded-for") || "";
  const candidates = [
    xfwd.split(",")[0]?.trim() || "",
    req.headers.get("cf-connecting-ip") || "",
    req.headers.get("x-real-ip") || "",
  ].filter(Boolean);

  const clientIp = candidates[0] || "";
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

  // 既存の処理
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

  // 既存の処理
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
