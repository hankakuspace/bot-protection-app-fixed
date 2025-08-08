import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.SHOPIFY_API_SECRET!;
const PROXY_SUBPATH = process.env.SHOPIFY_PROXY_SUBPATH || "bot-protection-proxy";

// App Proxy署名検証（OAuthのhmacではなくsignature）
function verifyAppProxySignature(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const signature = sp.get("signature");
  if (!signature) return { ok: false, reason: "missing_signature" as const };

  const path_prefix = sp.get("path_prefix") || `/apps/${PROXY_SUBPATH}`;
  const extra_path_raw = sp.get("extra_path") || "";
  const extra_path =
    extra_path_raw.startsWith("/") ? extra_path_raw : extra_path_raw ? `/${extra_path_raw}` : "";

  // signature 以外を key 昇順で & 連結
  const entries: Array<[string, string]> = [];
  sp.forEach((v, k) => {
    if (k !== "signature") entries.push([k, v]);
  });
  entries.sort(([a], [b]) => a.localeCompare(b));
  const qs = entries.map(([k, v]) => `${k}=${v}`).join("&");

  const message = `${path_prefix}${extra_path}${qs ? `?${qs}` : ""}`;
  const digest = crypto.createHmac("sha256", SECRET).update(message).digest("hex");

  const ok =
    digest.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));

  return ok
    ? { ok: true as const, path_prefix, extra_path, qs }
    : { ok: false as const, reason: "invalid_signature" as const, path_prefix, extra_path, qs };
}

// URL から extra_path を算出（/api/shopify/proxy の後ろ）
function getExtraPathEcho(req: Request) {
  const pathname = new URL(req.url).pathname;
  const p = pathname.replace(/^\/api\/shopify\/proxy/, "");
  return p || "/";
}

export async function GET(req: Request) {
  try {
    const v = verifyAppProxySignature(req);
    const extraPathEcho = g
