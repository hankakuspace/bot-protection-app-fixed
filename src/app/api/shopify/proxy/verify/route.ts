import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  // signature を取り出して除外
  const { signature, ...rest } = params;

  // canonical (署名対象文字列) を生成
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");

  // Client Secret を取得
  const secret = (process.env.SHOPIFY_API_SECRET || "").trim();

  // HMAC-SHA256(hex)
  const digest = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return NextResponse.json({
    ok: true,
    canonical: message,
    provided: signature,
    calculated: digest,
    match: signature === digest,
    note: "この実装はShopifyサポート提示のサンプルに準拠しています",
  });
}
