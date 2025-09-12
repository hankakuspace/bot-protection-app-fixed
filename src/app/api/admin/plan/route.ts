// src/app/api/admin/plan/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

// ✅ プラン取得
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop") || "demo-shop";

    const docRef = adminDb.collection("shops").doc(shop);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({
        plan: "Lite",
        usageLimit: 50000,
        billingStatus: "trial",
      });
    }

    return NextResponse.json(snap.data());
  } catch (err: any) {
    console.error("GET /api/admin/plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ プラン更新
export async function POST(req: Request) {
  try {
    const { shop = "demo-shop", plan } = await req.json();

    const limits: Record<string, number | null> = {
      Lite: 50000,
      Pro: 250000,
      Enterprise: null,
    };

    const usageLimit = limits[plan] ?? 0;

    await adminDb.collection("shops").doc(shop).set(
      {
        plan,
        usageLimit,
        billingStatus: "active",
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, plan, usageLimit });
  } catch (err: any) {
    console.error("POST /api/admin/plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
