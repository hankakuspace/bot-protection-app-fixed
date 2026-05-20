// src/app/admin/plan/page.tsx
"use client";

import { adminFetch } from "@/lib/admin-auth-fetch";
import { getPlanDefinition, type PlanKey } from "@/lib/plans";
import { FormEvent, useCallback, useEffect, useState } from "react";

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
  const [saving, setSaving] = useState(false);
  const [planKey, setPlanKey] = useState<PlanKey>("free");
  const [note, setNote] = useState("");
  const [targetShop, setTargetShop] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const currentPlan = getPlanDefinition(planKey);

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await adminFetch("/api/admin/plan", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop: targetShop,
          plan: planKey,
          note: note.trim(),
        }),
      });

      const parsed = (await response.json()) as PlanResponse & {
        success?: boolean;
      };

      if (!response.ok) {
        throw new Error(
          parsed.error || `プラン情報の更新に失敗しました (${response.status})`,
        );
      }

      setPlanKey(normalizePlanKey(parsed.plan || planKey));
      setTargetShop(parsed.shop || targetShop);
      setMessage(`${parsed.shop || targetShop} のプラン設定を保存しました。`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "プラン情報の更新中に不明なエラーが発生しました",
      );
    } finally {
      setSaving(false);
    }
  };

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

        {message ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                  Target Shop
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {targetShop || "取得中..."}
                </p>
              </div>

              <div>
                <label
                  htmlFor="plan"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  設定プラン
                </label>
                <select
                  id="plan"
                  value={planKey}
                  onChange={(event) =>
                    setPlanKey(normalizePlanKey(event.target.value))
                  }
                  disabled={loading || saving}
                  className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-3 text-sm outline-none focus:border-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="note"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  メモ
                </label>
                <textarea
                  id="note"
                  rows={4}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-3 text-sm outline-none focus:border-[#111827]"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading || saving}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "保存中..." : "プラン設定を保存"}
                </button>

                <button
                  type="button"
                  onClick={() => void fetchPlan()}
                  disabled={loading || saving}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 text-xs font-medium text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "取得中..." : "再取得"}
                </button>
              </div>
            </form>
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
