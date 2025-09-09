// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyHmac(query: URLSearchParams, clientSecret: string): boolean {
  const hmac = query.get("hmac")!;
  const params = [...query.entries()]
    .filter(([key]) => key !== "hmac")
    .map(([key, value]) => `${key}=${value}`)
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

    console.log("🔎 Callback params:", { shop, code, state });

    // Firestore に保存されている state 一覧を取得
    const snapshot = await db.collection("auth_states").get();
    const storedStates = snapshot.docs.map((d) => d.id);
    console.log("📂 Stored states:", storedStates);

    if (!shop || !code || !state) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    // Firestore から state を検証
    const doc = await db.collection("auth_states").doc(state).get();
    if (!doc.exists) {
      console.error("❌ State not found in Firestore:", state);
      return NextResponse.json({ ok: false, error: "invalid_state", state }, { status: 400 });
    }

    const data = doc.data();
    if (!data || data.shop !== shop) {
      console.error("❌ State/shop mismatch:", { expected: data?.shop, got: shop });
      return NextResponse.json({ ok: false, error: "state_shop_mismatch" }, { status: 400 });
    }

    // ✅ HMAC 検証
    if (!verifyHmac(url.searchParams, process.env.SHOPIFY_API_SECRET!)) {
      console.error("❌ HMAC verification failed");
      return NextResponse.json({ ok: false, error: "hmac_verification_failed" }, { status: 400 });
    }

    console.log("🎉 Auth success:", { shop, state });

    // 🎉 認証成功 → 任意のページにリダイレクト
    return NextResponse.redirect(`${process.env.SHOPIFY_APP_URL}/admin/logs`);
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.json({ ok: false, error: "auth_callback_failed" }, { status: 500 });
  }
}
