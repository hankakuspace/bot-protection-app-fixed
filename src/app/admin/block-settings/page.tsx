// src/app/admin/block-settings/page.tsx
"use client";

import { adminFetch } from "@/lib/admin-auth-fetch";
import { getPlanDefinition, type PlanKey } from "@/lib/plans";
import { FormEvent, useCallback, useEffect, useState } from "react";

type SettingsResponse = {
  shop?: string;
  plan?: PlanKey;
  countryBlockEnabled?: boolean;
  countryBlockActive?: boolean;
  blockedCountries?: string[];
  customBlockedPageEnabled?: boolean;
  customBlockedPageActive?: boolean;
  blockedPageTitle?: string;
  blockedPageMessage?: string;
  error?: string;
};

function normalizePlanKey(value: string | undefined): PlanKey {
  if (value === "basic" || value === "pro" || value === "free") {
    return value;
  }

  return "free";
}

export default function AdminBlockSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planKey, setPlanKey] = useState<PlanKey>("free");
  const [countryBlockEnabled, setCountryBlockEnabled] = useState(false);
  const [blockedCountriesText, setBlockedCountriesText] = useState("");
  const [customBlockedPageEnabled, setCustomBlockedPageEnabled] =
    useState(false);
  const [blockedPageTitle, setBlockedPageTitle] = useState(
    "このアクセスはブロックされました",
  );
  const [blockedPageMessage, setBlockedPageMessage] = useState(
    "あなたのIPアドレス、またはこのアクセス元は管理設定により拒否されています。",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [targetShop, setTargetShop] = useState("");

  const currentPlan = getPlanDefinition(planKey);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await adminFetch("/api/admin/plan", {
        method: "GET",
        cache: "no-store",
      });

      const parsed = (await response.json()) as SettingsResponse;

      if (!response.ok) {
        throw new Error(
          parsed.error || `ブロック設定の取得に失敗しました (${response.status})`,
        );
      }

      setTargetShop(parsed.shop || "");
      setTargetShop(parsed.shop || targetShop);
      setPlanKey(normalizePlanKey(parsed.plan));
      setCountryBlockEnabled(parsed.countryBlockActive === true);
      setBlockedCountriesText(
        Array.isArray(parsed.blockedCountries)
          ? parsed.blockedCountries.join(", ")
          : "",
      );
      setCustomBlockedPageEnabled(parsed.customBlockedPageActive === true);
      setBlockedPageTitle(
        typeof parsed.blockedPageTitle === "string"
          ? parsed.blockedPageTitle
          : "このアクセスはブロックされました",
      );
      setBlockedPageMessage(
        typeof parsed.blockedPageMessage === "string"
          ? parsed.blockedPageMessage
          : "あなたのIPアドレス、またはこのアクセス元は管理設定により拒否されています。",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ブロック設定の取得中に不明なエラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

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
          countryBlockEnabled,
          blockedCountries: blockedCountriesText
            .split(",")
            .map((country) => country.trim().toUpperCase())
            .filter((country) => /^[A-Z]{2}$/.test(country)),
          customBlockedPageEnabled,
          blockedPageTitle: blockedPageTitle.trim(),
          blockedPageMessage: blockedPageMessage.trim(),
        }),
      });

      const parsed = (await response.json()) as SettingsResponse & {
        success?: boolean;
      };

      if (!response.ok) {
        throw new Error(
          parsed.error || `ブロック設定の保存に失敗しました (${response.status})`,
        );
      }

      setPlanKey(normalizePlanKey(parsed.plan));
      setCountryBlockEnabled(parsed.countryBlockActive === true);
      setBlockedCountriesText(
        Array.isArray(parsed.blockedCountries)
          ? parsed.blockedCountries.join(", ")
          : blockedCountriesText,
      );
      setCustomBlockedPageEnabled(parsed.customBlockedPageActive === true);
      setBlockedPageTitle(
        typeof parsed.blockedPageTitle === "string"
          ? parsed.blockedPageTitle
          : blockedPageTitle,
      );
      setBlockedPageMessage(
        typeof parsed.blockedPageMessage === "string"
          ? parsed.blockedPageMessage
          : blockedPageMessage,
      );
      setMessage(`${parsed.shop || targetShop} のブロック設定を保存しました。`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ブロック設定の保存中に不明なエラーが発生しました",
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
            ブロック設定
          </h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            国別ブロックと、ブロック時に表示するページ文言を管理します。
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

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]"
        >
          <div className="space-y-4">
            <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Country Block
              </p>

              <div className="mt-4">
                <label
                  htmlFor="countryBlockEnabled"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#374151]"
                >
                  <input
                    id="countryBlockEnabled"
                    type="checkbox"
                    checked={countryBlockEnabled}
                    onChange={(event) =>
                      setCountryBlockEnabled(event.target.checked)
                    }
                    disabled={!currentPlan.countryBlockEnabled || loading || saving}
                    className="h-4 w-4"
                  />
                  国別ブロックを有効にする
                </label>
                <p className="mt-1 text-xs leading-6 text-[#6b7280]">
                  Proプランで利用できます。国コードはカンマ区切りで指定します。
                </p>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="blockedCountries"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  ブロック対象国コード
                </label>
                <input
                  id="blockedCountries"
                  type="text"
                  value={blockedCountriesText}
                  onChange={(event) => setBlockedCountriesText(event.target.value)}
                  placeholder="例: SG, IN, BD, VN"
                  disabled={!currentPlan.countryBlockEnabled || loading || saving}
                  className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-3 text-sm outline-none focus:border-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Custom Blocked Page
              </p>

              <div className="mt-4">
                <label
                  htmlFor="customBlockedPageEnabled"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#374151]"
                >
                  <input
                    id="customBlockedPageEnabled"
                    type="checkbox"
                    checked={customBlockedPageEnabled}
                    onChange={(event) =>
                      setCustomBlockedPageEnabled(event.target.checked)
                    }
                    disabled={
                      !currentPlan.customBlockedPageEnabled || loading || saving
                    }
                    className="h-4 w-4"
                  />
                  カスタムブロックページを有効にする
                </label>
                <p className="mt-1 text-xs leading-6 text-[#6b7280]">
                  Proプランで利用できます。ブロック時に表示する文言を変更します。
                </p>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="blockedPageTitle"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  ブロックページ見出し
                </label>
                <input
                  id="blockedPageTitle"
                  type="text"
                  value={blockedPageTitle}
                  onChange={(event) => setBlockedPageTitle(event.target.value)}
                  disabled={
                    !currentPlan.customBlockedPageEnabled || loading || saving
                  }
                  className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-3 text-sm outline-none focus:border-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="blockedPageMessage"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  ブロックページ本文
                </label>
                <textarea
                  id="blockedPageMessage"
                  rows={5}
                  value={blockedPageMessage}
                  onChange={(event) => setBlockedPageMessage(event.target.value)}
                  disabled={
                    !currentPlan.customBlockedPageEnabled || loading || saving
                  }
                  className="w-full rounded-xl border border-[#d1d5db] bg-white px-3 py-3 text-sm outline-none focus:border-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || saving}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "保存中..." : "ブロック設定を保存"}
              </button>

              <button
                type="button"
                onClick={() => void fetchSettings()}
                disabled={loading || saving}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 text-xs font-medium text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "取得中..." : "再取得"}
              </button>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
              Current Settings
            </p>

            <div className="mt-4 grid gap-3 text-xs text-[#374151] sm:grid-cols-2">
              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">プラン</p>
                <p className="mt-1">{currentPlan.name}</p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">国別ブロック</p>
                <p className="mt-1">
                  {currentPlan.countryBlockEnabled
                    ? countryBlockEnabled
                      ? "有効"
                      : "利用可"
                    : "未対応"}
                </p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">
                  ブロック対象国
                </p>
                <p className="mt-1">{blockedCountriesText || "-"}</p>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
                <p className="font-semibold text-[#111827]">
                  カスタムブロックページ
                </p>
                <p className="mt-1">
                  {currentPlan.customBlockedPageEnabled
                    ? customBlockedPageEnabled
                      ? "有効"
                      : "利用可"
                    : "未対応"}
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
