import { NextResponse } from "next/server";
import crypto from "crypto";
import { listIps } from "@/lib/ipStore";
import { matchIpRule, normalizeIp } from "@/lib/ipMatch";

/** Shopify App Proxy 署名検証 */
function verifyProxySignature(query: URLSearchParams, secret: string) {
  if (!secret) return false;
  const params = new URLSearchParams(query);
  const signatureHex = params.get("signature") || "";
  params.delete("signature");
  const keys = Array.from(new Set(Array.from(params.keys()))).sort();
  const message = keys.map(k => `${k}=${params.getAll(k).join(",")}`).join("");
  const calcHex = crypto.createHmac("sha256", secret).update(message).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(signatureHex, "hex"), Buffer.from(calcHex, "hex")); }
  catch { return false; }
}

/** 実クライアントIP（cf-connecting-ip → x-forwarded-for → x-real-ip） */
function resolveClientIp(req: Request) {
  const cf = req.headers.get("cf-connecting-ip") || "";
  const xfwd = req.headers.get("x-forwarded-for") || "";
  const xri = req.headers.get("x-real-ip") || "";
  const candidates = [cf, xfwd.split(",")[0]?.trim() || "", xri].filter(Boolean);
  return candidates[0] || "";
}

/** 403 監査ログの最小項目 */
function auditWarn(payload: Record<string, unknown>) {
  // Vercel Logs で検索しやすい固定タグにしておく
  console.warn("[ipblock] deny", JSON.stringify(payload));
}

/** IPブロック判定：一致なら 403  */
async function enforceIpBlock(req: Request, ctx: { shop?: string; slug?: string[] }) {
  const raw = resolveClientIp(req);
  if (!raw) return;

  let ip = raw;
  try { ip = normalizeIp(raw); } catch {}

  const rules = await listIps();
  const matched = matchIpRule(ip, rules);
  if (matched) {
    // 監査ログ（最小）：ip / matched ルール / country / ua / shop / slug
    auditWarn({
      ip,
      matched,
      shop: ctx.shop || "",
      slug: (ctx.slug || []).join("/"),
      country: req.headers.get("cf-ipcountry") || "",
      ua: req.headers.get("user-agent") || "",
      at: new Date().toISOString(),
    });
    throw new Response(JSON.stringify({ ok: false, error: "blocked ip" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
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

  const slug: string[] = (params?.slug as string[]) ?? [];
  try { await enforceIpBlock(req, { shop: query.get("shop") || "", slug }); }
  catch (res) { return res as Response; }

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

  const slug: string[] = (params?.slug as string[]) ?? [];
  try { await enforceIpBlock(req, { shop: query.get("shop") || "", slug }); }
  catch (res) { return res as Response; }

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
