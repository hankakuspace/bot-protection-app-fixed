// src/app/api/admin/list-admin-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const snapshot = await adminDb.collection("admin_ips").orderBy("createdAt", "desc").get();
    const ips = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
    }));
    return NextResponse.json(ips);
  } catch (err: any) {
    console.error("list-admin-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
