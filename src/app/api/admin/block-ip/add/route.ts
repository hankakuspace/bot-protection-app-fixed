// src/app/api/admin/block-ip/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";
import * as ipaddr from "ipaddr.js";

export const runtime = "nodejs";

// ✅ IP正規化関数
function normalizeIp(ip: string): string {
  try {
    if (!ipaddr.isValid(ip)) return ip;
    const parsed = ipaddr.parse(ip);

    if (parsed.kind() === "ipv6") {
      // IPv6は /64 に丸める
      const parts = parsed.toNormalizedString().split(":");
      const prefix = parts.slice(0, 4).join(":"); // 上位64ビット
      return `${prefix}::/64`;
    } else {
      // IPv4はそのまま
      return parsed.toString();
    }
  } catch {
    return ip;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ip, note } = await req.json();
    if (!ip) {
      return NextResponse.json({ error: "Missing IP" }, { status: 400 });
    }

    // ✅ 入力値を正規化
    const normalizedIp = normalizeIp(ip);

    // ✅ すでに同じブロックIPが存在するかチェック
    const dupSnap = await adminDb
      .collection("blocked_ips")
      .where("ip", "==", normalizedIp)
      .get();

    if (!dupSnap.empty) {
      return NextResponse.json(
        { error: "このIPはすでにブロック登録されています" },
        { status: 400 }
      );
    }

    // ✅ 管理者IPとの競合チェック（管理者IPも normalize して比較）
    const adminSnap = await adminDb.collection("admin_ips").get();
    const adminIps = adminSnap.docs.map((doc) => doc.data().ip);

    const isConflict = adminIps.some((adminIp: string) => {
      const normalizedAdmin = normalizeIp(adminIp);
      return normalizedAdmin === normalizedIp;
    });

    if (isConflict) {
      return NextResponse.json(
        { error: "管理者IPはブロックIPに登録できません" },
        { status: 400 }
      );
    }

    // Firestore に保存
    await adminDb.collection("blocked_ips").add({
      ip: normalizedIp,
      note: note || "",
      blocked: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, ip: normalizedIp });
  } catch (err: any) {
    console.error("block-ip/add error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
