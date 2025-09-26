// src/app/exitiframe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const appUrl = process.env.SHOPIFY_APP_URL || "https://bot-protection-ten.vercel.app";

  // ✅ クエリなしでTOPに戻す
  const target = `${appUrl}/`;

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
