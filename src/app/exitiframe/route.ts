// src/app/exitiframe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ ok: false, error: "missing_shop" }, { status: 400 });
  }

  const appUrl = process.env.SHOPIFY_APP_URL || "https://bot-protection-ten.vercel.app";

  // ✅ ここで自分のアプリURLに戻す（admin.shopify.com には飛ばさない）
  const target = `${appUrl}/admin/dashboard?shop=${shop}`;

  const html = `
    <html>
      <body>
        <script type="text/javascript">
          window.top.location.href = "${target}";
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
