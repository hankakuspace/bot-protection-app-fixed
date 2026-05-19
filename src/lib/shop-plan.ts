// src/lib/shop-plan.ts
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  getPlanDefinition,
  PLAN_DEFINITIONS,
  type PlanDefinition,
  type PlanKey,
} from "@/lib/plans";

function normalizeShop(shop: string | null | undefined): string {
  return (shop || "be-search.biz").trim().toLowerCase();
}

export function normalizePlanKey(
  planKey: string | null | undefined,
): PlanKey | null {
  if (planKey === "free" || planKey === "basic" || planKey === "pro") {
    return planKey;
  }

  return null;
}

export async function getShopPlanKey(
  shop: string | null | undefined,
): Promise<PlanKey | null> {
  const normalizedShop = normalizeShop(shop);

  const snapshot = await adminDb
    .collection("shop_settings")
    .doc(normalizedShop)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() || {};
  const plan = typeof data.plan === "string" ? data.plan : "";

  return normalizePlanKey(plan);
}

export async function getEffectivePlanDefinition(
  shop: string | null | undefined,
  requestedPlanKey?: string | null,
): Promise<PlanDefinition> {
  const normalizedRequestedPlan = normalizePlanKey(requestedPlanKey);

  if (normalizedRequestedPlan) {
    return PLAN_DEFINITIONS[normalizedRequestedPlan];
  }

  const shopPlanKey = await getShopPlanKey(shop);

  return getPlanDefinition(shopPlanKey);
}

export async function saveShopPlanSetting({
  shop,
  plan,
  note,
  countryBlockEnabled,
  blockedCountries,
  customBlockedPageEnabled,
  blockedPageTitle,
  blockedPageMessage,
}: {
  shop: string;
  plan: PlanKey;
  note?: string;
  countryBlockEnabled?: boolean;
  blockedCountries?: string[];
  customBlockedPageEnabled?: boolean;
  blockedPageTitle?: string;
  blockedPageMessage?: string;
}) {
  const normalizedShop = normalizeShop(shop);

  const updateData: Record<string, unknown> = {
    shop: normalizedShop,
    plan,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof note === "string") {
    updateData.note = note;
  }

  if (typeof countryBlockEnabled === "boolean") {
    updateData.countryBlockEnabled = countryBlockEnabled;
  }

  if (Array.isArray(blockedCountries)) {
    updateData.blockedCountries = blockedCountries;
  }

  if (typeof customBlockedPageEnabled === "boolean") {
    updateData.customBlockedPageEnabled = customBlockedPageEnabled;
  }

  if (typeof blockedPageTitle === "string") {
    updateData.blockedPageTitle = blockedPageTitle;
  }

  if (typeof blockedPageMessage === "string") {
    updateData.blockedPageMessage = blockedPageMessage;
  }

  await adminDb
    .collection("shop_settings")
    .doc(normalizedShop)
    .set(updateData, { merge: true });

  return {
    shop: normalizedShop,
    plan,
    ...(typeof note === "string" ? { note } : {}),
    ...(typeof countryBlockEnabled === "boolean"
      ? { countryBlockEnabled }
      : {}),
    ...(Array.isArray(blockedCountries) ? { blockedCountries } : {}),
    ...(typeof customBlockedPageEnabled === "boolean"
      ? { customBlockedPageEnabled }
      : {}),
    ...(typeof blockedPageTitle === "string" ? { blockedPageTitle } : {}),
    ...(typeof blockedPageMessage === "string" ? { blockedPageMessage } : {}),
  };
}
