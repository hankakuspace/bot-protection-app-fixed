// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

export default function DashboardPage() {
  const [plan, setPlan] = useState<string>("Lite");
  const [usage, setUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number | null>(50000);
  const [billingStatus, setBillingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [hydrated, setHydrated] = useState(false);

  const shop = "ruhra-store.myshopify.com"; // TODO: 認証から取得

  // ✅ スピナー
  const Spinner = () => (
    <svg
      className="animate-spin h-5 w-5 text-gray-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );

  useEffect(() => {
    const fetchPlan = async () => {
      setLoadingPlan(true);
      try {
        const res = await fetch(`/api/admin/plan?shop=${shop}`);
        const data = await res.json();
        if (data.plan) {
          setPlan(data.plan);
          setLimit(data.usageLimit ?? null);
          setBillingStatus(data.billingStatus ?? "trial");
        }
      } finally {
        setLoadingPlan(false);
      }
    };

    const fetchUsage = async () => {
      setLoadingUsage(true);
      try {
        const res = await fetch(`/api/admin/usage?shop=${shop}`);
        const data = await res.json();
        setUsage(data.usageCount);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchPlan();
    fetchUsage();
    setHydrated(true); // ✅ CSRでのみナビを描画
  }, []);

  const confirmPlanChange = async (newPlan: string) => {
    setPendingPlan(null);
    setPlan(newPlan);

    const res = await fetch("/api/admin/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, plan: newPlan }),
    });

    const data = await res.json();
    if (data.plan) {
      setLimit(data.usageLimit ?? null);
      setBillingStatus("active");
    }

    setMessage(`プランを「${newPlan}」に保存しました`);
    setTimeout(() => setMessage(""), 3000);
  };

  const getUsageStatus = () => {
    if (limit === null) return { color: "green", label: "利用無制限" };
    const ratio = usage / limit;
    if (ratio >= 0.9) return { color: "red", label: "危険：上限間近" };
    if (ratio >= 0.7) return { color: "orange", label: "注意：利用が増加中" };
    return { color: "green", label: "正常稼働中" };
  };

  const usageStatus = getUsageStatus();
  const usageRatio = limit === null ? 0 : Math.min((usage / limit) * 100, 100);

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* ✅ Shopify 標準ナビゲーション */}
      {hydrated && (
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <ui-nav-menu>
                <a href="/admin/dashboard">ダッシュボード</a>
                <a href="/admin/logs">アクセスログ</a>
                <a href="/admin/admin-ip">管理者設定</a>
                <a href="/admin/block-ip">ブロック設定</a>
              </ui-nav-menu>
            `,
          }}
        />
      )}

      <h1 className="text-2xl font-bold mb-4">管理ダッシュボード</h1>

      {/* 🔔 Trial 警告バナー */}
      {billingStatus === "trial" && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
          <p className="font-bold">現在トライアル期間中です</p>
          <p className="text-sm">
            プランを有効化しないと機能が停止する可能性があります。
          </p>
        </div>
      )}

      {/* ✅ 課金ステータス */}
      <div className="bg-white p-4 rounded-md border shadow-sm">
        {loadingPlan ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Spinner />
            <span className="text-sm">課金ステータスを取得中...</span>
          </div>
        ) : (
          <p className="text-sm text-gray-700">
            課金ステータス: <strong>{billingStatus ?? "-"}</strong>
          </p>
        )}
      </div>

      {/* ✅ 上限利用警告バナー */}
      <div
        className={`flex items-center gap-3 p-4 rounded-md border shadow-sm ${
          usageStatus.color === "red"
            ? "bg-red-50 border-red-300 text-red-800"
            : usageStatus.color === "orange"
            ? "bg-orange-50 border-orange-300 text-orange-800"
            : "bg-green-50 border-green-300 text-green-800"
        }`}
      >
        {loadingUsage ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Spinner />
            <span className="text-sm">利用状況を取得中...</span>
          </div>
        ) : (
          <>
            <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0" />
            <span className="font-medium">
              {usageStatus.label}（{usage} / {limit === null ? "∞" : limit}）
            </span>
          </>
        )}
      </div>

      {/* ✅ プラン切り替え */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <p className="mb-3 text-sm font-medium text-gray-700">現在のプラン</p>
        {loadingPlan ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Spinner />
            <span className="text-sm">プランを取得中...</span>
          </div>
        ) : (
          <div className="flex gap-3">
            {["Lite", "Pro", "Enterprise"].map((p) => (
              <button
                key={p}
                onClick={() => setPendingPlan(p)}
                className={`px-4 py-2 rounded-md border font-medium transition ${
                  plan === p
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ✅ 利用数 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-3">
        <p className="text-sm text-gray-700">
          今月の利用数:
          {loadingUsage ? (
            <span className="inline-flex items-center gap-2 ml-2 text-gray-500">
              <Spinner />
              取得中...
            </span>
          ) : (
            <span className="font-semibold ml-2">
              {usage} / {limit === null ? "∞" : limit}
            </span>
          )}
        </p>
        {!loadingUsage && limit !== null && (
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                usageStatus.color === "red"
                  ? "bg-red-500"
                  : usageStatus.color === "orange"
                  ? "bg-orange-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${usageRatio}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* ✅ モーダル */}
      {pendingPlan &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-semibold mb-4">プラン変更確認</h2>
              <p className="mb-6">
                プランを <strong>{pendingPlan}</strong> に変更しますか？
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPendingPlan(null)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => confirmPlanChange(pendingPlan)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  変更する
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ✅ トースト通知 */}
      {message &&
        createPortal(
          <div className="fixed top-6 right-6 z-[9999]">
            <div className="flex items-center gap-2 px-4 py-3 bg-white border rounded-md shadow-lg text-gray-800 animate-fade-in-out">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
