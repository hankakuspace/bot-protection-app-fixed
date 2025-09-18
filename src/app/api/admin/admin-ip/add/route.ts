// src/app/api/admin/admin-ip/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

// ✅ IPv6を/64プレフィックスに正規化する関数
function normalizeIp(ip: string): { id: string; prefix: string } {
  if (!ip) return { id: ip, prefix: ip };
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", ""); // IPv4-mapped IPv6

  if (ip.includes(":")) {
    // IPv6 → /64 プレフィックスで保存
    const prefix = ip.split(":").slice(0, 4).join(":") + "::/64";
    // Firestoreのdoc IDに使えるように "/" を "_" に置換
    const safeId = prefix.replace(/\//g, "_");
    return { id: safeId, prefix };
  }

  // IPv4はそのまま
  return { id: ip, prefix: ip };
}

export async function POST(req: NextRequest) {
  try {
    const { ip, note } = await req.json();
    if (!ip) {
      return NextResponse.json({ error: "Missing IP" }, { status: 400 });
    }

    const { id, prefix } = normalizeIp(ip);

    await adminDb.collection("admin_ips").doc(id).set({
      ip: prefix, // ✅ 表示用には /64付き
      note: note || "",
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, ip: prefix });
  } catch (err: any) {
    console.error("add-admin-ip error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
