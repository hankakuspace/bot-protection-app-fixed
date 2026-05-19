// src/lib/plans.ts
export type PlanKey = "free" | "basic" | "pro";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  monthlyPriceUsd: number;
  maxBlockedIps: number;
  accessLogRetentionDays: number;
  csvExportEnabled: boolean;
  countryDisplayEnabled: boolean;
  countryBlockEnabled: boolean;
  customBlockedPageEnabled: boolean;
};

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    maxBlockedIps: 5,
    accessLogRetentionDays: 7,
    csvExportEnabled: false,
    countryDisplayEnabled: true,
    countryBlockEnabled: false,
    customBlockedPageEnabled: false,
  },
  basic: {
    key: "basic",
    name: "Basic",
    monthlyPriceUsd: 9,
    maxBlockedIps: 100,
    accessLogRetentionDays: 30,
    csvExportEnabled: true,
    countryDisplayEnabled: true,
    countryBlockEnabled: false,
    customBlockedPageEnabled: false,
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyPriceUsd: 19,
    maxBlockedIps: 1000,
    accessLogRetentionDays: 90,
    csvExportEnabled: true,
    countryDisplayEnabled: true,
    countryBlockEnabled: true,
    customBlockedPageEnabled: true,
  },
};

export function getPlanDefinition(planKey: string | null | undefined) {
  if (planKey === "basic" || planKey === "pro" || planKey === "free") {
    return PLAN_DEFINITIONS[planKey];
  }

  return PLAN_DEFINITIONS.free;
}
