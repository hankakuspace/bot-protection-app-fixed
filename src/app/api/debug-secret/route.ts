# → 先ほどのコードを貼り付けて保存

# ステージング
git add src/app/api/debug-secret/route.ts

# コミット
git commit -m "Add debug endpoint to check SHOPIFY_API_SECRET in production"

# プッシュ（本番デプロイ）
git push origin main

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
