// src/app/admin/billing/page.tsx
"use client";

import { adminFetch } from "@/lib/admin-auth-fetch";
import { PLAN_DEFINITIONS, type PlanKey } from "@/lib/plans";
import { useCallback, useEffect, useState } from "react";

type PlanResponse = {
  shop?: string;
  plan?: PlanKey;
  error?: string;
};

const planOrder: PlanKey[] = ["free", "basic", "pro"];

const planDescriptions: Record<PlanKey, string> = {
  free: "まずは最低限のアクセス確認とIPブロックを試したいストア向け。",
  basic: "小規模〜中規模ストア向け。CSV出力と30日ログに対応。",
  pro: "国別ブロックやカスタムブロックページまで使いたいストア向け。",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";

  return `$${price}/月`;
}

export default function AdminBillingPage() {
  const [currentPlanKey, setCurrentPlanKey] = useState<PlanKey>("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCurrentPlan = useCallback(async () => {
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

      if (
        parsed.plan === "free" ||
        parsed.plan === "basic" ||
        parsed.plan === "pro"
      ) {
        setCurrentPlanKey(parsed.plan);
      }
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
    void fetchCurrentPlan();
  }, [fetchCurrentPlan]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div className="w-full px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-6">
          <h1 className="text-base font-semibold text-[#111827]">
            料金プラン
          </h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            Store Access Guard の各プランで利用できる機能を比較できます。
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {planOrder.map((planKey) => {
            const plan = PLAN_DEFINITIONS[planKey];
            const isCurrentPlan = currentPlanKey === plan.key;

            return (
              <section
                key={plan.key}
                className={[
                  "relative rounded-2xl border bg-white p-5 shadow-sm",
                  isCurrentPlan
                    ? "border-[#111827] ring-1 ring-[#111827]"
                    : "border-[#e5e7eb]",
                ].join(" ")}
              >
                {isCurrentPlan ? (
                  <div className="absolute right-4 top-4 rounded-full bg-[#111827] px-3 py-1 text-[11px] font-semibold text-white">
                    現在のプラン
                  </div>
                ) : null}

                <p className="text-sm font-semibold text-[#111827]">
                  {plan.name}
                </p>

                <div className="mt-3 flex items-end gap-1">
                  <p className="text-3xl font-bold tracking-tight text-[#111827]">
                    {formatPrice(plan.monthlyPriceUsd)}
                  </p>
                </div>

                <p className="mt-3 min-h-[40px] text-xs leading-6 text-[#6b7280]">
                  {planDescriptions[plan.key]}
                </p>

                <div className="mt-5 space-y-3 border-t border-[#e5e7eb] pt-5 text-sm text-[#374151]">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>ブロックIP登録: {plan.maxBlockedIps}件まで</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>アクセスログ保存目安: {plan.accessLogRetentionDays}日</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>IP判定国表示</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span
                      className={[
                        "mt-1 h-2 w-2 rounded-full",
                        plan.csvExportEnabled
                          ? "bg-emerald-500"
                          : "bg-[#d1d5db]",
                      ].join(" ")}
                    />
                    <span>
                      CSV出力: {plan.csvExportEnabled ? "利用可" : "未対応"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span
                      className={[
                        "mt-1 h-2 w-2 rounded-full",
                        plan.countryBlockEnabled
                          ? "bg-emerald-500"
                          : "bg-[#d1d5db]",
                      ].join(" ")}
                    />
                    <span>
                      国別ブロック:{" "}
                      {plan.countryBlockEnabled ? "利用可" : "未対応"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span
                      className={[
                        "mt-1 h-2 w-2 rounded-full",
                        plan.customBlockedPageEnabled
                          ? "bg-emerald-500"
                          : "bg-[#d1d5db]",
                      ].join(" ")}
                    />
                    <span>
                      カスタムブロックページ:{" "}
                      {plan.customBlockedPageEnabled ? "利用可" : "未対応"}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-medium text-white opacity-60"
                  >
                    {isCurrentPlan
                      ? "現在のプランです"
                      : "Shopify Pricing連携後に変更可能"}
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 text-xs leading-6 text-[#6b7280] shadow-sm">
          <p>
            現時点では、プラン変更は手動設定またはShopify App
            Pricing連携後の導線で行う想定です。正式公開時はShopify
            Billingの画面で安全に処理されます。
          </p>
        </div>
      </div>
    </main>
  );
}
