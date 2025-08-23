// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("✅ Proxy HIT:", req.url);

  // 🔑 まずは絶対200返す
  return new NextResponse(
    `
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h1>🚀 Proxy Connected</h1>
          <p>このページが出れば App Proxy のルート接続成功です。</p>
          <p>URL: ${req.url}</p>
        </body>
      </html>
    `,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

export async function POST(req: NextRequest) {
  console.log("✅ Proxy POST HIT:", req.url);
  return NextResponse.json({ ok: true, message: "Proxy POST OK" });
}
