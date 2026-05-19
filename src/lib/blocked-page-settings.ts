// src/lib/blocked-page-settings.ts
import { adminDb } from "@/lib/firebase-admin";
import { getEffectivePlanDefinition } from "@/lib/shop-plan";

export type BlockedPageSettings = {
  enabled: boolean;
  title: string;
  message: string;
};

const DEFAULT_BLOCKED_PAGE_TITLE = "このアクセスはブロックされました";
const DEFAULT_BLOCKED_PAGE_MESSAGE =
  "あなたのIPアドレス、またはこのアクセス元は管理設定により拒否されています。";

function normalizeShop(shop: string | null | undefined): string {
  return (shop || "be-search.biz").trim().toLowerCase();
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";

  return value.trim();
}

export async function getBlockedPageSettings(
  shop: string | null | undefined,
): Promise<BlockedPageSettings> {
  const normalizedShop = normalizeShop(shop);
  const currentPlan = await getEffectivePlanDefinition(normalizedShop, null);

  if (!currentPlan.customBlockedPageEnabled) {
    return {
      enabled: false,
      title: DEFAULT_BLOCKED_PAGE_TITLE,
      message: DEFAULT_BLOCKED_PAGE_MESSAGE,
    };
  }

  const snapshot = await adminDb
    .collection("shop_settings")
    .doc(normalizedShop)
    .get();

  const data = snapshot.exists ? snapshot.data() || {} : {};
  const enabled = data.customBlockedPageEnabled === true;
  const title =
    normalizeText(data.blockedPageTitle) || DEFAULT_BLOCKED_PAGE_TITLE;
  const message =
    normalizeText(data.blockedPageMessage) || DEFAULT_BLOCKED_PAGE_MESSAGE;

  return {
    enabled,
    title,
    message,
  };
}
