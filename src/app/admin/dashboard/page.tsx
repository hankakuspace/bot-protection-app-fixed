// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

export default function DashboardPage() {
  const [plan, setPlan] = useState<string>("Lite");
  const [usage, setUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50000);
  const [message, setMessage] = useState<string>("");

  const shop = "demo-shop"; // TODO: 実際は認証から取得

  // プラン上限値
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

  // 利用数・プランを取得
  useEffect(() => {
    const fetchData = async () => {
      const shopRef = doc(db, "shops", shop);
      const snap = await getDoc(shopRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.plan) {
          setPlan(data.plan);
          setLimit(getLimit(data.plan));
        }
      }

      // ✅ usage_logs から今月の利用数を取得する想定
      // 実際は API 呼び出しで集計
      setUsage(43000); // テスト用
    };
    fetchData();
  }, []);

  const handlePlanChange = async (newPlan: string) => {
    setPlan(newPlan);
    setLimit(getLimit(newPlan));
    const shopRef = doc(db, "shops", shop);
    await setDoc(shopRef, { plan: newPlan }, { merge: true });
    setMessage("保存しました");
    setTimeout(() => setMessage(""), 3000);
  };

  // ✅ 上限警告レベル判定
  const getUsageStatus = () => {
    if (limit === Infinity) return { color: "green", label: "利用無制限" };
    const ratio = usage / limit;
    if (ratio >= 0.9) return { color: "red", label: "危険：上限間近" };
    if (ratio >= 0.7) return { color: "orange", label: "注意：利用が増加中" };
    return { color: "green", label: "正常稼働中" };
  };

  const usageStatus = getUsageStatus();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">管理ダッシュボード</h1>

      {/* ✅ 保存通知バナー */}
      {message && (
        <div className="flex items-center gap-2 p-3 rounded-md border bg-green-50 border-green-300 text-green-800">
          <CheckCircleIcon className="h-5 w-5" />
          <span>{message}</span>
        </div>
      )}

      {/* ✅ 上限利用警告バナー */}
      {limit !== Infinity && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md border ${
            usageStatus.color === "red"
              ? "bg-red-50 border-red-300 text-red-800"
              : usageStatus.color === "orange"
              ? "bg-orange-50 border-orange-300 text-orange-800"
              : "bg-green-50 border-green-300 text-green-800"
          }`}
        >
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>
            {usageStatus.label}（{usage} / {limit}）
          </span>
        </div>
      )}

      <div>
        <p className="mb-2">
          現在のプラン: <strong>{plan}</strong>
        </p>
        <select
          value={plan}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="border rounded p-2"
        >
          <option value="Lite">Lite</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>

      <div>
        <p>
          今月の利用数: <strong>{usage}</strong> /{" "}
          {limit === Infinity ? "∞" : limit}
        </p>
      </div>
    </div>
  );
}
