// src/app/api/admin/list-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyShopifyAdminRequest } from "@/lib/verify-shopify-admin-request";
import { getEffectivePlanDefinition } from "@/lib/shop-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function serializeValue(value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date };

    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString();
    }

    const result: { [key: string]: JsonValue } = {};

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = serializeValue(nestedValue);
    }

    return result;
  }

  return String(value);
}

function hasConflictingShop(request: NextRequest, shop: string): boolean {
  const headerShop = request.headers.get("x-shopify-shop-domain");
  return request.nextUrl.searchParams.getAll("shop").some(
    (value) => value.trim().toLowerCase() !== shop,
  ) || (headerShop !== null && headerShop.trim().toLowerCase() !== shop);
}

function isSameShop(
  data: Record<string, JsonValue>,
  targetShop: string,
): boolean {
  const shop = data.shop;
  const normalizedTargetShop = targetShop.trim().toLowerCase();
  return typeof shop === "string" &&
    shop.trim().toLowerCase() === normalizedTargetShop;
}

function getSortableCreatedAt(data: Record<string, JsonValue>): number {
  const value = data.createdAt || data.timestamp || data.time || data.date;

  if (typeof value !== "string" && typeof value !== "number") {
    return 0;
  }

  const text = String(value).trim();
  if (!text) {
    return 0;
  }

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const numeric = Number(text);
  if (!Number.isNaN(numeric)) {
    return text.length <= 10 ? numeric * 1000 : numeric;
  }

  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = verifyShopifyAdminRequest(request);

    if (!authResult.ok || !authResult.shop.trim()) {
      return NextResponse.json(
        { error: "管理APIの認証に失敗しました。" },
        { status: 401 },
      );
    }

    const shop = authResult.shop.trim().toLowerCase();
    if (hasConflictingShop(request, shop)) {
      return NextResponse.json(
        { error: "他ショップの設定にはアクセスできません。" },
        { status: 403 },
      );
    }

    const currentPlan = await getEffectivePlanDefinition(shop, null);
    let snapshot;

    try {
      snapshot = await adminDb
        .collection("blocked_ips")
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();
    } catch {
      snapshot = await adminDb.collection("blocked_ips").limit(200).get();
    }

    const ips = snapshot.docs
      .map((doc) => {
        const data =
          (serializeValue(doc.data()) as Record<string, JsonValue>) || {};

        return {
          id: doc.id,
          ...data,
        };
      })
      .filter((item) => isSameShop(item, shop))
      .sort((a, b) => getSortableCreatedAt(b) - getSortableCreatedAt(a))
      .slice(0, 100);

    return NextResponse.json({
      ips,
      shop,
      plan: currentPlan.key,
      maxBlockedIps: currentPlan.maxBlockedIps,
    });
  } catch (error) {
    console.error("GET /api/admin/list-ip error:", error);

    return NextResponse.json(
      { error: "ブロックIP一覧の取得に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = verifyShopifyAdminRequest(request);

    if (!authResult.ok || !authResult.shop.trim()) {
      return NextResponse.json(
        { error: "管理APIの認証に失敗しました。" },
        { status: 401 },
      );
    }

    const shop = authResult.shop.trim().toLowerCase();
    if (hasConflictingShop(request, shop)) {
      return NextResponse.json(
        { error: "他ショップの設定にはアクセスできません。" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      id?: unknown;
      shop?: unknown;
      note?: unknown;
    };

    const id = typeof body.id === "string" ? body.id.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : undefined;

    if (!id) {
      return NextResponse.json(
        { error: "更新対象のIDが指定されていません。" },
        { status: 400 },
      );
    }

    if (body.shop !== undefined &&
        (typeof body.shop !== "string" || body.shop.trim().toLowerCase() !== shop)) {
      return NextResponse.json(
        { error: "他ショップの設定にはアクセスできません。" },
        { status: 403 },
      );
    }

    const updateData: {
      updatedAt: Date;
      note?: string;
    } = {
      updatedAt: new Date(),
    };

    if (note !== undefined) {
      updateData.note = note;
    }

    if (id.includes("/")) {
      return NextResponse.json({ error: "無効なIDです。" }, { status: 400 });
    }
    const ref = adminDb.collection("blocked_ips").doc(id);
    // The ownership read and write must share one transaction so a concurrent
    // ownership change cannot authorize a stale update or deletion.
    const result = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return 404;
      const owner = snapshot.data()?.shop;
      if (typeof owner !== "string" || owner.trim().toLowerCase() !== shop) return 403;
      transaction.update(ref, updateData);
      return 200;
    });
    if (result !== 200) {
      return NextResponse.json(
        { error: result === 404 ? "対象のIP設定が見つかりません。" : "他ショップまたは所有ショップ不明の設定は変更できません。" },
        { status: result },
      );
    }

    return NextResponse.json({
      success: true,
      id,
      shop,
      note: note ?? null,
    });
  } catch (error) {
    console.error("PATCH /api/admin/list-ip error:", error);

    return NextResponse.json(
      { error: "ブロックIPの更新に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = verifyShopifyAdminRequest(request);

    if (!authResult.ok || !authResult.shop.trim()) {
      return NextResponse.json(
        { error: "管理APIの認証に失敗しました。" },
        { status: 401 },
      );
    }

    const shop = authResult.shop.trim().toLowerCase();
    if (hasConflictingShop(request, shop)) {
      return NextResponse.json(
        { error: "他ショップの設定にはアクセスできません。" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "削除対象のIDが指定されていません。" },
        { status: 400 },
      );
    }

    if (id.includes("/")) {
      return NextResponse.json({ error: "無効なIDです。" }, { status: 400 });
    }
    const ref = adminDb.collection("blocked_ips").doc(id);
    // The ownership read and write must share one transaction so a concurrent
    // ownership change cannot authorize a stale update or deletion.
    const result = await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return 404;
      const owner = snapshot.data()?.shop;
      if (typeof owner !== "string" || owner.trim().toLowerCase() !== shop) return 403;
      transaction.delete(ref);
      return 200;
    });
    if (result !== 200) {
      return NextResponse.json(
        { error: result === 404 ? "対象のIP設定が見つかりません。" : "他ショップまたは所有ショップ不明の設定は変更できません。" },
        { status: result },
      );
    }

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("DELETE /api/admin/list-ip error:", error);

    return NextResponse.json(
      { error: "ブロックIPの削除に失敗しました。" },
      { status: 500 },
    );
  }
}
