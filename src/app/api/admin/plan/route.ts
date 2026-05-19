// src/app/api/admin/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getEffectivePlanDefinition, saveShopPlanSetting } from "@/lib/shop-plan";
import { verifyShopifyAdminRequest } from "@/lib/verify-shopify-admin-request";
import { normalizePlanKey } from "@/lib/shop-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getShopFromRequest(request: NextRequest): string {
  const queryShop = request.nextUrl.searchParams.get("shop") || "";
  const headerShop = request.headers.get("x-shopify-shop-domain") || "";

  return (queryShop || headerShop || "be-search.biz").trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    const authResult = verifyShopifyAdminRequest(request);

    if (!authResult.ok) {
      return NextResponse.json(
        { error: "管理APIの認証に失敗しました。" },
        { status: 401 },
      );
    }

    const shop = getShopFromRequest(request);
    const currentPlan = await getEffectivePlanDefinition(shop, null);

    return NextResponse.json({
      shop,
      plan: currentPlan.key,
      planName: currentPlan.name,
      maxBlockedIps: currentPlan.maxBlockedIps,
      accessLogRetentionDays: currentPlan.accessLogRetentionDays,
      csvExportEnabled: currentPlan.csvExportEnabled,
      countryDisplayEnabled: currentPlan.countryDisplayEnabled,
      countryBlockEnabled: currentPlan.countryBlockEnabled,
      customBlockedPageEnabled: currentPlan.customBlockedPageEnabled,
    });
  } catch (error) {
    console.error("GET /api/admin/plan error:", error);

    return NextResponse.json(
      { error: "プラン情報の取得に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = verifyShopifyAdminRequest(request);

    if (!authResult.ok) {
      return NextResponse.json(
        { error: "管理APIの認証に失敗しました。" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      shop?: unknown;
      plan?: unknown;
      note?: unknown;
    };

    const shop =
      typeof body.shop === "string" && body.shop.trim()
        ? body.shop.trim().toLowerCase()
        : getShopFromRequest(request);

    const plan = normalizePlanKey(
      typeof body.plan === "string" ? body.plan : "",
    );

    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!plan) {
      return NextResponse.json(
        { error: "plan は free / basic / pro のいずれかを指定してください。" },
        { status: 400 },
      );
    }

    const saved = await saveShopPlanSetting({
      shop,
      plan,
      note,
    });

    const currentPlan = await getEffectivePlanDefinition(shop, null);

    return NextResponse.json({
      success: true,
      ...saved,
      planName: currentPlan.name,
      maxBlockedIps: currentPlan.maxBlockedIps,
      accessLogRetentionDays: currentPlan.accessLogRetentionDays,
      csvExportEnabled: currentPlan.csvExportEnabled,
      countryDisplayEnabled: currentPlan.countryDisplayEnabled,
      countryBlockEnabled: currentPlan.countryBlockEnabled,
      customBlockedPageEnabled: currentPlan.customBlockedPageEnabled,
    });
  } catch (error) {
    console.error("PATCH /api/admin/plan error:", error);

    return NextResponse.json(
      { error: "プラン情報の更新に失敗しました。" },
      { status: 500 },
    );
  }
}
