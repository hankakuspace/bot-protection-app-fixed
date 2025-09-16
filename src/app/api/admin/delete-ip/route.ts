// src/app/api/admin/delete-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    const { id, type } = await req.json(); // type: "admin" | "block" | "country"
    if (!id || !type) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let collection = "";
    if (type === "admin") {
      collection = "admin_ips";
    } else if (type === "block") {
      collection = "blocked_ips";
    } else if (type === "country") {
      collection = "blocked_countries";
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    await adminDb.collection(collection).doc(id).delete();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("delete-ip error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
