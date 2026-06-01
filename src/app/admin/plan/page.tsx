// src/app/admin/plan/page.tsx
"use client";

import { adminFetch } from "@/lib/admin-auth-fetch";
import { getPlanDefinition, type PlanKey } from "@/lib/plans";
import { useCallback, useEffect, useState } from "react";

type PlanResponse = {
  shop?: string;
  plan?: PlanKey;
  planName?: string;
  maxBlockedIps?: number;
  accessLogRetentionDays?: number;
  csvExportEnabled?: boolean;
  countryDisplayEnabled?: boolean;
  countryBlockEnabled?: boolean;
  customBlockedPageEnabled?: boolean;
  error?: string;
};

function normalizePlanKey(value: string): PlanKey {
  if (value === "basic" || value === "pro" || value === "free") {
    return value;
  }

  return "free";
}

export default function AdminPlanPage() {
  const [loading, setLoading] = useState(true);
  const [planKey, setPlanKey] = useState<PlanKey>("free");
  const [targetShop, setTargetShop] = useState("");
  const [error, setError] = useState("");
  const currentPlan = getPlanDefinition(planKey);
  const storeHandle = targetShop.replace(/\.myshopify\.com$/, "");
  const pricingPlansUrl = storeHandle
    ? `https://admin.shopify.com/store/${storeHandle}/charges/store-access-guard/pricing_plans`
    : "";

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminFetch("/api/admin/plan", {
        method: "GET",
        cache: "no-store",
      });

      const parsed = (await response.json()) as PlanResponse;

      if (!response.ok) {
        throw new Error(
          parsed.error || `プラン情報の取得に失敗しました (${response.status})`,
        );
      }

      setPlanKey(normalizePlanKey(parsed.plan || "free"));
      setTargetShop(parsed.shop || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "プラン情報の取得中に不明なエラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div className="w-full px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-6">
          <h1 className="text-base font-semibold text-[#111827]">
            プラン設定
          </h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            このストアに適用するプランを確認・設定できます。
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                  Target Shop
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {targetShop || "取得中..."}
                </p>
              </div>

              <div>
                <p className="mb-2 block text-sm font-semibold text-[#374151]">
                  現在のプラン
                </p>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                  <p className="text-sm font-semibold text-[#111827]">
                    {loading ? "取得中..." : currentPlan.name}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-[#6b7280]">
                    プランの変更は、Shopify App Pricing のプラン選択画面で承認して行います。
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {pricingPlansUrl ? (
                  <a
                    href={pricingPlansUrl}
                    target="_top"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-medium text-white transition hover:opacity-90"
                  >
                    Shopifyでプランを変更する
                  </a>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-medium text-white opacity-60">
                    プラン変更リンクを読み込み中
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => void fetchPlan()}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 text-xs font-medium text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "取得中..." : "再取得"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
              Current Plan Preview
            </p>

            <div className="mt-4 grid gap-3 text-xs text-[#374151] sm:grid-cols-2">
              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">プラン</p>
                <p className="mt-1">{currentPlan.name}</p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">月額料金</p>
                <p className="mt-1">
                  {currentPlan.monthlyPriceUsd === 0
                    ? "Free"
                    : `$${currentPlan.monthlyPriceUsd}/月`}
                </p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">IP登録上限</p>
                <p className="mt-1">{currentPlan.maxBlockedIps}件</p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">ログ保存目安</p>
                <p className="mt-1">{currentPlan.accessLogRetentionDays}日</p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">CSV出力</p>
                <p className="mt-1">
                  {currentPlan.csvExportEnabled ? "利用可" : "未対応"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">国別ブロック</p>
                <p className="mt-1">
                  {currentPlan.countryBlockEnabled ? "利用可" : "未対応"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">
                  カスタムブロックページ
                </p>
                <p className="mt-1">
                  {currentPlan.customBlockedPageEnabled ? "利用可" : "未対応"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-[#6b7280]">
              この画面では手動プラン設定のみを保存します。国別ブロックとカスタムブロックページは「ブロック設定」で管理します。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
