// src/app/api/admin/add-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getPlanDefinition } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeIp(raw: string): string {
  return raw.trim().replace(/^::ffff:/, "");
}

function getShopFromRequest(request: NextRequest, bodyShop?: string): string {
  const queryShop = request.nextUrl.searchParams.get("shop") || "";
  const headerShop = request.headers.get("x-shopify-shop-domain") || "";
  const shop = (bodyShop || queryShop || headerShop || "be-search.biz")
    .trim()
    .toLowerCase();

  return shop;
}

function getPlanKeyFromRequest(request: NextRequest, bodyPlan?: string): string {
  const queryPlan = request.nextUrl.searchParams.get("plan") || "";
  const headerPlan = request.headers.get("x-bot-protection-plan") || "";

  return (bodyPlan || queryPlan || headerPlan || "free").trim().toLowerCase();
}






function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^
d+$/.test(part)) {
      return false;
    }

    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

function isSameShopOrLegacy(
  data: FirebaseFirestore.DocumentData,
  targetShop: string,
): boolean {
  const shop = data.shop;

  if (typeof shop === "string") {
    return shop.trim() === "" || shop.trim().toLowerCase() === targetShop;
  }

  return shop === null || shop === undefined;
}

async function countBlockedIpsForShop(shop: string): Promise<number> {
  const snapshot = await adminDb.collection("blocked_ips").limit(500).get();

  return snapshot.docs.filter((doc) => {
    return isSameShopOrLegacy(doc.data(), shop);
  }).length;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      ip?: string;
      note?: string;
      shop?: string;
      plan?: string;
    };

    const ip = normalizeIp(body.ip ?? "");
    const note = (body.note ?? "").trim();
    const shop = getShopFromRequest(request, body.shop);
    const currentPlan = getPlanDefinition(getPlanKeyFromRequest(request, body.plan));

    if (!ip) {
      return NextResponse.json(
        { error: "IPアドレスを入力してください。" },
        { status: 400 },
      );
    }

    if (!isValidIpv4(ip)) {
      return NextResponse.json(
        { error: "IPv4形式で入力してください。" },
        { status: 400 },
      );
    }

    const existingForShop = await adminDb
      .collection("blocked_ips")
      .where("ip", "==", ip)
      .where("shop", "==", shop)
      .limit(1)
      .get();

    if (!existingForShop.empty) {
      return NextResponse.json({
        success: true,
        duplicated: true,
        message: "このIPアドレスはすでに登録されています。",
        ip,
        shop,
      });
    }

    const legacyExisting = await adminDb
      .collection("blocked_ips")
      .where("ip", "==", ip)
      .limit(20)
      .get();

    const hasLegacyExisting = legacyExisting.docs.some((doc) => {
      const data = doc.data();
      const legacyShop = data.shop;

      return (
        legacyShop === undefined ||
        legacyShop === null ||
        (typeof legacyShop === "string" && legacyShop.trim() === "")
      );
    });

    if (hasLegacyExisting) {
      return NextResponse.json({
        success: true,
        duplicated: true,
        message: "このIPアドレスはすでに登録されています。",
        ip,
        shop,
      });
    }

    const currentBlockedIpCount = await countBlockedIpsForShop(shop);

    if (currentBlockedIpCount >= currentPlan.maxBlockedIps) {
      return NextResponse.json(
        {
          success: false,
          error: `${currentPlan.name}プランではブロックIPを${currentPlan.maxBlockedIps}件まで登録できます。`,
          plan: currentPlan.key,
          maxBlockedIps: currentPlan.maxBlockedIps,
          currentBlockedIpCount,
          shop,
        },
        { status: 403 },
      );
    }

    const docRef = await adminDb.collection("blocked_ips").add({
      ip,
      note,
      shop,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "IPを登録しました。",
      id: docRef.id,
      ip,
      shop,
    });
  } catch (error) {
    console.error("POST /api/admin/add-ip error:", error);

    return NextResponse.json(
      { error: "IPの登録に失敗しました。" },
      { status: 500 },
    );
  }
}
