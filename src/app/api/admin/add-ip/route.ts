// src/app/api/admin/add-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip } = body;

    console.log("[API] add-ip request:", body);

    if (!ip || typeof ip !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid IP" }, { status: 400 });
    }

    // Firestore に保存
    await db.collection("blocked_ips").add({
      ip,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("[API] added ip:", ip);

    return NextResponse.json({ ok: true, added: ip });
  } catch (error) {
    console.error("[API] Error in add-ip:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
