// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyHmacFromRaw(req: NextRequest, clientSecret: string): boolean {
  const url = new URL(req.url);
  const rawQuery = url.search.slice(1);
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

    if (!shop || !code || !state) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const doc = await adminDb.collection("auth_states").doc(state).get();
    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 400 });
    }

    if (!verifyHmacFromRaw(req, process.env.SHOPIFY_API_SECRET!)) {
      return NextResponse.json({ ok: false, error: "hmac_verification_failed" }, { status: 400 });
    }

    console.log("🎉 Auth success:", { shop, state });

    // ✅ 新規インストール完了時だけ exitiframe 経由で Admin に戻す
    const appUrl = process.env.APP_URL || "https://bot-protection-ten.vercel.app";
    return NextResponse.redirect(`${appUrl}/exitiframe?shop=${shop}`);
  } catch (err) {
    return NextResponse.json({ ok: false, error: "auth_callback_failed" }, { status: 500 });
  }
}
