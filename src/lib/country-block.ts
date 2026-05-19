// src/lib/country-block.ts
import { adminDb } from "@/lib/firebase-admin";
import { getEffectivePlanDefinition } from "@/lib/shop-plan";

export type CountryBlockSettings = {
  enabled: boolean;
  blockedCountries: string[];
};

function normalizeShop(shop: string | null | undefined): string {
  return (shop || "be-search.biz").trim().toLowerCase();
}

function normalizeCountryCode(value: unknown): string {
  if (typeof value !== "string") return "";

  return value.trim().toUpperCase();
}

function normalizeBlockedCountries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => normalizeCountryCode(item))
        .filter((country) => /^[A-Z]{2}$/.test(country)),
    ),
  );
}

export async function getCountryBlockSettings(
  shop: string | null | undefined,
): Promise<CountryBlockSettings> {
  const normalizedShop = normalizeShop(shop);
  const currentPlan = await getEffectivePlanDefinition(normalizedShop, null);

  if (!currentPlan.countryBlockEnabled) {
    return {
      enabled: false,
      blockedCountries: [],
    };
  }

  const snapshot = await adminDb
    .collection("shop_settings")
    .doc(normalizedShop)
    .get();

  const data = snapshot.exists ? snapshot.data() || {} : {};
  const enabled = data.countryBlockEnabled === true;
  const blockedCountries = normalizeBlockedCountries(data.blockedCountries);

  return {
    enabled,
    blockedCountries,
  };
}

export async function isCountryBlocked({
  shop,
  country,
}: {
  shop: string | null | undefined;
  country: string | null | undefined;
}): Promise<boolean> {
  const normalizedCountry = normalizeCountryCode(country);

  if (!normalizedCountry) {
    return false;
  }

  const settings = await getCountryBlockSettings(shop);

  if (!settings.enabled) {
    return false;
  }

  return settings.blockedCountries.includes(normalizedCountry);
}
