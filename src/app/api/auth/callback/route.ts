// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import crypto from "crypto";

export const runtime = "nodejs";

// ✅ HMAC 検証（raw queryベース）
function verifyHmacFromRaw(req: NextRequest, clientSecret: string): boolean {
  const url = new URL(req.url);

  const rawQuery = url.search.slice(1); // "?" を除いた raw query
  const hmac = url.searchParams.get("hmac");
  if (!hmac) return false;

  const params = rawQuery
    .split("&")
    .filter((kv) => !kv.startsWith("hmac="))
    .sort()
    .join("&");

  const digest = crypto.createHmac("sha256", clientSecret).update(params).digest("hex");
  return digest === hmac;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get("shop");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const host = url.searchParams.get("host"); // ✅ Shopify Admin が渡してくるパラメータ

    console.log("🔎 Callback params:", { shop, state, code, host });

    if (!shop || !code || !state) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    // Firestore から state を検証
    const doc = await db.collection("auth_states").doc(state).get();
    if (!doc.exists) {
      console.error("❌ State not found:", state);
      return NextResponse.json({ ok: false, error: "invalid_state", state }, { status: 400 });
    }

    const data = doc.data();
    if (!data || data.shop !== shop) {
      console.error("❌ State/shop mismatch:", { expected: data?.shop, got: shop });
      return NextResponse.json({ ok: false, error: "state_shop_mismatch" }, { status: 400 });
    }

    // ✅ HMAC 検証（raw query使用）
    if (!verifyHmacFromRaw(req, process.env.SHOPIFY_API_SECRET!)) {
      console.error("❌ HMAC verification failed");
      return NextResponse.json({ ok: false, error: "hmac_verification_failed" }, { status: 400 });
    }

    console.log("🎉 Auth success:", { shop, state });

    // 🎉 認証成功後 → host付きURLでトップレベルにリダイレクト
    return new NextResponse(
      `<script>
        var target = "${process.env.SHOPIFY_APP_URL}?shop=${shop}&host=${host}";
        if (window.top === window.self) {
          window.location.href = target;
        } else {
          window.top.location.href = target;
        }
      </script>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.json({ ok: false, error: "auth_callback_failed" }, { status: 500 });
  }
}
