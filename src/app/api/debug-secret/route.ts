import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * 本番環境でSHOPIFY_API_SECRETが正しく設定されているか確認するエンドポイント
 * 確認後は必ず削除してください
 */
export async function GET() {
  const secret = process.env.SHOPIFY_API_SECRET || "";
  
  return NextResponse.json({
    ok: !!secret,
    length: secret.length,
    preview: secret ? secret.slice(0, 4) + "...(hidden)" : null,
    note: "確認後はこのエンドポイントを削除してください"
  });
}
