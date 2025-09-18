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

    // ✅ IPv6は/64に正規化
    const normalizedIp = normalizeIp(ip);

    // ✅ 管理者IPとの競合チェック
    const adminSnap = await adminDb.collection("admin_ips").get();
    const adminIps = adminSnap.docs.map((doc) => doc.data().ip);

    const isConflict = adminIps.some((adminIp: string) => {
      try {
        const adminAddr = ipaddr.parse(adminIp);

        // 管理者IPを /128 (単一アドレスのCIDR) として扱う
        const adminCidr: [ipaddr.IPv4 | ipaddr.IPv6, number] = [adminAddr, adminAddr.kind() === "ipv6" ? 128 : 32];

        if (normalizedIp.includes("/")) {
          const blockCidr = ipaddr.parseCIDR(normalizedIp);
          // 双方向チェック: 管理者IPがブロック範囲に含まれる OR ブロックが管理者に一致
          return adminAddr.match(blockCidr) || ipaddr.parse(adminIp).match(adminCidr);
        } else {
          const blockAddr = ipaddr.parse(normalizedIp);
          return adminAddr.toNormalizedString() === blockAddr.toNormalizedString();
        }
      } catch {
        return false;
      }
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
