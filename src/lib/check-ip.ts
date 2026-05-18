// src/lib/check-ip.ts
import { adminDb } from "./firebase-admin";

function normalizeShop(shop?: string): string {
  return (shop || "").trim().toLowerCase();
}

function hasLegacyShopValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string" && value.trim() === "") {
    return true;
  }

  return false;
}

export async function isIpBlocked(
  ip: string,
  shop?: string,
): Promise<boolean> {
  const normalizedShop = normalizeShop(shop);

  if (normalizedShop) {
    const shopSnapshot = await adminDb
      .collection("blocked_ips")
      .where("ip", "==", ip)
      .where("shop", "==", normalizedShop)
      .limit(1)
      .get();

    if (!shopSnapshot.empty) {
      return true;
    }
  }

  const legacySnapshot = await adminDb
    .collection("blocked_ips")
    .where("ip", "==", ip)
    .limit(20)
    .get();

  return legacySnapshot.docs.some((doc) => {
    const data = doc.data();
    return hasLegacyShopValue(data.shop);
  });
}
