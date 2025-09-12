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
  const [limit, setLimit] = useState<number>(50000);
  const [message, setMessage] = useState<string>("");

  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const shop = "demo-shop"; // TODO: 認証から取得

  const getLimit = (plan: string) => {
    switch (plan) {
      case "Lite":
        return 50000;
      case "Pro":
        return 250000;
      case "Enterprise":
        return Infinity;
      default:
        return 0;
    }
  };

  useEffect(() => {
    // ✅ プラン取得API
    const fetchPlan = async () => {
      const res = await fetch(`/api/admin/plan?shop=${shop}`);
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        setLimit(getLimit(data.plan));
      }
    };

    // ✅ 利用数取得API
    const fetchUsage = async () => {
      const res = await fetch(`/api/admin/usage?shop=${shop}`);
      const data = await res.json();
      setUsage(data.usageCount);
    };

    fetchPlan();
    fetchUsage();
  }, []);

  const confirmPlanChange = async (newPlan: string) => {
    setPendingPlan(null); // 先に閉じる
    setPlan(newPlan);
    setLimit(getLimit(newPlan));

    await fetch("/api/admin/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, plan: newPlan }),
    });

    setMessage(`プランを「${newPlan}」に保存しました`);
    setTimeout(() => setMessage(""), 3000);
  };

  const getUsageStatus = () => {
    if (limit === Infinity) return { color: "green", label: "利用無制限" };
    const ratio = usage / limit;
    if (ratio >= 0.9) return { color: "red", label: "危険：上限間近" };
    if (ratio >= 0.7) return { color: "orange", label: "注意：利用が増加中" };
    return { color: "green", label: "正常稼働中" };
  };

  const usageStatus = getUsageStatus();
  const usageRatio = limit === Infinity ? 0 : Math.min((usage / limit) * 100, 100);

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold">管理ダッシュボード</h1>

      {/* ✅ 上限利用警告バナー */}
      {limit !== Infinity && (
        <div
          className={`flex items-center gap-3 p-4 rounded-md border shadow-sm ${
            usageStatus.color === "red"
              ? "bg-red-50 border-red-300 text-red-800"
              : usageStatus.color === "orange"
              ? "bg-orange-50 border-orange-300 text-orange-800"
              : "bg-green-50 border-green-300 text-green-800"
          }`}
        >
          <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0" />
          <span className="font-medium">
            {usageStatus.label}（{usage} / {limit === Infinity ? "∞" : limit}）
          </span>
        </div>
      )}

      {/* ✅ プラン切り替え */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <p className="mb-3 text-sm font-medium text-gray-700">現在のプラン</p>
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
      </div>

      {/* ✅ 利用数 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-3">
        <p className="text-sm text-gray-700">
          今月の利用数:{" "}
          <span className="font-semibold">
            {usage} / {limit === Infinity ? "∞" : limit}
          </span>
        </p>
        {limit !== Infinity && (
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
