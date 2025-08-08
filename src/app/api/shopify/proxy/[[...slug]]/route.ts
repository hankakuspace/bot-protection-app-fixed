import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.SHOPIFY_API_SECRET!;
const PROXY_SUBPATH = process.env.SHOPIFY_PROXY_SUBPATH || "bot-protection-proxy";

// App Proxy署名検証（OAuthのhmacではなく signature）
function verifyAppProxySignature(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const signature = sp.get("signature");
  if (!signature) return { ok: false as const, reason: "missing_signature" as const };

  const path_prefix = sp.get("path_prefix") || `/apps/${PROXY_SUBPATH}`;
  const extra_path_raw = sp.get("extra_path") || "";
  const extra_path = extra_path_raw.startsWith("/")
    ? extra_path_raw
    : extra_path_raw
    ? `/${extra_path_raw}`
    : "";

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

// /api/shopify/proxy の後ろを echo 用に取り出す
function getExtraPathEcho(req: Request) {
  const pathname = new URL(req.url).pathname;
  const p = pathname.replace(/^\/api\/shopify\/proxy/, "");
  return p || "/";
}

export async function GET(req: Request) {
  try {
    const v = verifyAppProxySignature(req);
    const extraPathEcho = getExtraPathEcho(req);

    if (!v.ok) {
      return new NextResponse(
        [
          "[bot-protection-proxy] signature verification failed",
          `reason: ${v.reason}`,
          `extra_path(echo): ${extraPathEcho}`,
          `debug.path_prefix: ${"path_prefix" in v ? v.path_prefix : ""}`,
          `debug.extra_path: ${"extra_path" in v ? v.extra_path : ""}`,
          `debug.qs: ${"qs" in v ? v.qs : ""}`,
        ].join("\n"),
        { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }
      );
    }

    return new NextResponse(
      [
        "[bot-protection-proxy] ok",
        `extra_path(echo): ${extraPathEcho}`,
        `path_prefix: ${v.path_prefix}`,
        `extra_path: ${v.extra_path}`,
        `qs: ${v.qs}`,
      ].join("\n"),
      { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return new NextResponse(
      `[bot-protection-proxy] handler exception\n${String(e)}`,
      { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
