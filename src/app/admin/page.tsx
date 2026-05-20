// src/app/admin/page.tsx
"use client";

import { adminFetch } from "@/lib/admin-auth-fetch";
import { getPlanDefinition, type PlanKey } from "@/lib/plans";
import { useCallback, useEffect, useState } from "react";

const APP_HANDLE = "store-access-guard";

const planBadgeStyles = {
  free: {
    wrapper:
      "inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-[#1d4ed8]",
    icon: "flex h-6 w-6 items-center justify-center rounded-full bg-[#dbeafe] text-[11px] font-bold text-[#1d4ed8]",
  },
  basic: {
    wrapper:
      "inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[#15803d]",
    icon: "flex h-6 w-6 items-center justify-center rounded-full bg-[#dcfce7] text-[11px] font-bold text-[#15803d]",
  },
  pro: {
    wrapper:
      "inline-flex items-center gap-2 rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1 text-[#6d28d9]",
    icon: "flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fe] text-[11px] font-bold text-[#6d28d9]",
  },
};

type PlanResponse = {
  shop?: string;
  plan?: PlanKey;
  error?: string;
};

function normalizePlanKey(value: string | undefined): PlanKey {
  if (value === "basic" || value === "pro" || value === "free") {
    return value;
  }

  return "free";
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shop, setShop] = useState("");
  const [planKey, setPlanKey] = useState<PlanKey>("free");

  const currentPlan = getPlanDefinition(planKey);
  const planBadgeStyle = planBadgeStyles[currentPlan.key];
  const storeHandle = shop.replace(/\.myshopify\.com$/, "");
  const themeEditorUrl = storeHandle
    ? `https://admin.shopify.com/store/${storeHandle}/themes/current/editor?context=apps`
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

      setShop(parsed.shop || "");
      setPlanKey(normalizePlanKey(parsed.plan));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "プラン情報の取得中に不明なエラーが発生しました",
      );
      setPlanKey("free");
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
            ダッシュボード
          </h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            IPブロック管理とアクセスログ確認を行う管理画面です。
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Current Plan
              </p>
              <div className="mt-2">
                <span className={planBadgeStyle.wrapper}>
                  <span className={planBadgeStyle.icon}>
                    {currentPlan.name.charAt(0)}
                  </span>
                  <span className="text-sm font-semibold">
                    {loading ? "取得中..." : currentPlan.name}
                  </span>
                </span>
              </div>
              <p className="mt-2 text-xs text-[#6b7280]">
                {shop
                  ? `対象ストア：${shop}`
                  : "インストール中ストアのプラン情報を表示します。"}
              </p>
            </div>

            <div className="grid gap-3 text-xs text-[#374151] sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="font-semibold text-[#111827]">IP判定国表示</p>
                <p className="mt-1">
                  {currentPlan.countryDisplayEnabled ? "対応済み" : "未対応"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                App embed setup
              </p>
              <h2 className="mt-2 text-sm font-semibold text-[#111827]">
                ストアフロント保護を有効化する
              </h2>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-6 text-[#4b5563]">
                <li>Online Store &gt; Themes &gt; Customize を開きます。</li>
                <li>左メニューの App embeds を開きます。</li>
                <li>Store Access Guard をONにします。</li>
                <li>Save を押してテーマに反映します。</li>
              </ol>
            </div>

            {themeEditorUrl ? (
              <a
                href={themeEditorUrl}
                target="_top"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-medium text-white transition hover:opacity-90"
              >
                テーマエディタを開く
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/admin/logs"
            className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:border-[#d1d5db]"
          >
            <p className="text-sm font-semibold text-[#111827]">
              アクセスログ
            </p>
            <p className="mt-2 text-xs leading-6 text-[#6b7280]">
              アクセス履歴の確認、期間指定を行います。
            </p>
          </a>

          <a
            href="/admin/list-ip"
            className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:border-[#d1d5db]"
          >
            <p className="text-sm font-semibold text-[#111827]">
              ブロックIP一覧
            </p>
            <p className="mt-2 text-xs leading-6 text-[#6b7280]">
              登録済みのブロックIPを確認・削除します。
            </p>
          </a>

          <a
            href="/admin/add-ip"
            className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:border-[#d1d5db]"
          >
            <p className="text-sm font-semibold text-[#111827]">
              ブロックIP追加
            </p>
            <p className="mt-2 text-xs leading-6 text-[#6b7280]">
              新しく拒否するIPアドレスを登録します。
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
