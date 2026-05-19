// src/lib/shop-plan.ts
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  getPlanDefinition,
  PLAN_DEFINITIONS,
  type PlanDefinition,
  type PlanKey,
} from "@/lib/plans";

export type ShopPlanSetting = {
  shop: string;
  plan: PlanKey;
  note: string;
  updatedAt: FirebaseFirestore.FieldValue;
};

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
}: {
  shop: string;
  plan: PlanKey;
  note?: string;
  countryBlockEnabled?: boolean;
  blockedCountries?: string[];
}) {
  const normalizedShop = normalizeShop(shop);

  await adminDb.collection("shop_settings").doc(normalizedShop).set(
    {
      shop: normalizedShop,
      plan,
      note: note || "",
      ...(typeof countryBlockEnabled === "boolean"
        ? { countryBlockEnabled }
        : {}),
      ...(Array.isArray(blockedCountries) ? { blockedCountries } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    shop: normalizedShop,
    plan,
    note: note || "",
    ...(typeof countryBlockEnabled === "boolean"
      ? { countryBlockEnabled }
      : {}),
    ...(Array.isArray(blockedCountries) ? { blockedCountries } : {}),
  };
}
