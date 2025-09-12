// src/app/api/admin/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

// ✅ プラン取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    const shopDoc = await db.collection("shops").doc(shop).get();
    const plan = shopDoc.exists ? shopDoc.data()?.plan || "Lite" : "Lite";

    return NextResponse.json({ shop, plan });
  } catch (err: any) {
    console.error("GET plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ プラン更新
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop, plan } = body;

    if (!shop || !plan) {
      return NextResponse.json({ error: "Missing shop or plan" }, { status: 400 });
    }

    await db.collection("shops").doc(shop).set({ plan }, { merge: true });

    return NextResponse.json({ success: true, shop, plan });
  } catch (err: any) {
    console.error("POST plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
