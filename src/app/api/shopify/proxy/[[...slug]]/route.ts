import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";       // Edge回避（crypto使用）
export const dynamic = "force-dynamic"; // キャッシュ無効

const SECRET = process.env.SHOPIFY_API_SECRET!;
const PROXY_SUBPATH = process.env.SHOPIFY_PROXY_SUBPATH || "bot-protection-proxy";

/**
 * Shopify App Proxy の署名検証（OAuthの hmac ではなく "signature"）
 * 検証対象: path_prefix + extra_path + "?" + (signature 以外のクエリを key 昇順で & 連結)
 */
function verifyAppProxySignature(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const signature = sp.get("signature");
  if (!signature) return { ok: false as const, reason: "missing_signature" as const };

  const path_prefix = sp.get("path_prefix") || `/apps/${PROXY_SUBPATH}`;
  const extra_path_raw = sp.get("extra_path") || "";
  const extra_path =
    extra_path_raw.startsWith("/") ? extra_path_raw : extra_path_raw ? `/${extra_path_raw}` : "";

  // signature 以外のクエリを key 昇順で結合
  const entries: Array<[string, string]> = [];
  sp.forEach((v, k) => { if (k !== "signature") entries.push([k, v]); });
  entries.sort(([a], [b]) => a.localeCompare(b));
  const qs = entries.map(([k, v]) => `${k}=${v}`).join("&");

  const message = `${path_prefix}${extra_path}${qs ? `?${qs}` : ""}`;
  const digest = crypto.createHmac("sha256", SECRET).update(message).digest("hex");

  const ok =
    digest.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));

  return ok
    ? { ok: true as const, path_prefix, extra_path, qs }
    : { ok: false as const, reason: "invalid_signature" as const, path_prefix, extra_path, qs, signature };
}

/** /api/shopify/proxy の後ろをそのまま echo（デバッグ用） */
function getExtraPathEcho(req: Request) {
  const pathname = new URL(req.url).pathname;
  const p = pathname.replace(/^\/api\/shopify\/proxy/, "");
  return p || "/";
}

/** 失敗時に HTML で返す（Shopifyの白画面回避用・常に200） */
function htmlFail(body: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8" />
     <div style="padding:16px;font:14px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial">
       ${body}
     </div>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );
}

export async function GET(req: Request) {
  try {
    const v = verifyAppProxySignature(req);
    const extraPathEcho = getExtraPathEcho(req);

    if (!v.ok) {
      return htmlFail(
        [
          `<h1 style="margin:0 0 12px;">[bot-protection-proxy] signature verification failed</h1>`,
          `<p><b>reason:</b> ${v.reason}</p>`,
          `<p><b>extra_path(echo):</b> ${extraPathEcho}</p>`,
          `<pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:8px">` +
          `path_prefix: ${"path_prefix" in v ? v.path_prefix : ""}\n` +
          `extra_path: ${"extra_path" in v ? v.extra_path : ""}\n` +
          `qs: ${"qs" in v ? v.qs : ""}` +
          `</pre>`
        ].join("")
      );
    }

    // 署名OK: とりあえず疎通（本処理はここから書き換え）
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
    return htmlFail(
      `<h1 style="margin:0 0 12px;">[bot-protection-proxy] handler exception</h1><pre>${String(e)}</pre>`
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
