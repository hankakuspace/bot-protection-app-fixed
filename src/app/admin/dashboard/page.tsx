// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

export default function DashboardPage() {
  const [plan, setPlan] = useState<string>("Lite");
  const [usage, setUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50000);
  const [message, setMessage] = useState<string>("");

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
    const fetchPlan = async () => {
      const shopRef = doc(db, "shops", shop);
      const snap = await getDoc(shopRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.plan) {
          setPlan(data.plan);
          setLimit(getLimit(data.plan));
        }
      }
    };

    const fetchUsage = async () => {
      const res = await fetch(`/api/admin/usage?shop=${shop}`);
      const data = await res.json();
      setUsage(data.usageCount);
    };

    fetchPlan();
    fetchUsage();
  }, []);

  const handlePlanChange = async (newPlan: string) => {
    setPlan(newPlan);
    setLimit(getLimit(newPlan));
    const shopRef = doc(db, "shops", shop);
    await setDoc(shopRef, { plan: newPlan }, { merge: true });
    setMessage("プランを保存しました");
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

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold">管理ダッシュボード</h1>

      {/* ✅ 保存通知バナー */}
      {message && (
        <div className="flex items-center gap-3 p-4 rounded-md border shadow-sm bg-green-50 border-green-300 text-green-800">
          <CheckCircleIcon className="h-6 w-6 flex-shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

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
              onClick={() => handlePlanChange(p)}
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

      {/* ✅ 利用数表示 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <p className="text-sm text-gray-700">
          今月の利用数:{" "}
          <span className="font-semibold">
            {usage} / {limit === Infinity ? "∞" : limit}
          </span>
        </p>
      </div>
    </div>
  );
}
