// FILE: src/app/api/shopify/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac") || "";
  const code = url.searchParams.get("code");

  if (!shop || !hmac || !code) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // --- HMAC 検証 ---
  const params = [...url.searchParams.entries()]
    .filter(([key]) => key !== "hmac")
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("&");

  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(params)
    .digest("hex");

  if (digest !== hmac) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 400 });
  }

  // --- アクセストークン取得 ---
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("❌ Token exchange failed:", errText);
    return NextResponse.json(
      { error: "Token exchange failed", detail: errText },
      { status: 500 }
    );
  }

  const tokenData = await tokenRes.json();
  console.log("✅ Access token issued:", tokenData);

  // TODO: FirestoreやDBに保存する処理をここに追加する

  // --- Shopify埋め込み対応: 管理画面のアプリURLに移動 ---
  return new NextResponse(
    `
    <html>
      <head>
        <script type="text/javascript">
          window.top.location.href = "https://${shop}/admin/apps/bpp-20250814-final01";
        </script>
      </head>
      <body>
        <p>アプリにリダイレクトしています...</p>
      </body>
    </html>
    `,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
