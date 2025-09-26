// src/app/exitiframe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ ok: false, error: "missing_shop" }, { status: 400 });
  }

  const shopName = shop.replace(".myshopify.com", "");
  const handle = "bot-protection-proxy";
  const target = `https://admin.shopify.com/store/${shopName}/apps/${handle}`;

  // ✅ 公式パターン: <script> で top window をリダイレクト
  return new NextResponse(
    `<script>
       if (window.top === window.self) {
         window.location.href = "${target}";
       } else {
         window.top.location.href = "${target}";
       }
     </script>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
