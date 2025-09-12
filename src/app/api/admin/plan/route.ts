// src/app/api/admin/plan/route.ts
import { NextResponse } from "next/server";
import adminDb from "@/lib/firebase"; // firebase-admin (admin SDK)

export const runtime = "nodejs";

// ✅ プラン取得
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop") || "demo-shop";

    const docRef = adminDb.collection("shops").doc(shop);
    const snap = await docRef.get();
    const plan = snap.exists ? snap.data()?.plan || "Lite" : "Lite";

    return NextResponse.json({ plan });
  } catch (err: any) {
    console.error("GET /api/admin/plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ プラン更新
export async function POST(req: Request) {
  try {
    const { shop = "demo-shop", plan } = await req.json();

    await adminDb.collection("shops").doc(shop).set({ plan }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/admin/plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
