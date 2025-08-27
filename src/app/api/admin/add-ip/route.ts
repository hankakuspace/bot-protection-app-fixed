// src/app/api/admin/add-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { serverTimestamp } from "firebase/firestore"; // 追加

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip } = body;

    if (!ip || typeof ip !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid IP" }, { status: 400 });
    }

    // Firestore に保存（自動IDで安全に）
    await db.collection("blocked_ips").add({
      ip,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true, added: ip });
  } catch (error) {
    console.error("Error in add-ip:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
