// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { clientDb } from "@/lib/firebase";

export default function DashboardPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<string | null>(null);
  const [usage, setUsage] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const shopId = "test-shop"; // TODO: 実際は認証から取得
      const shopRef = clientDb.collection("shops").doc(shopId);
      const doc = await shopRef.get();
      if (doc.exists) {
        const data = doc.data();
        setPlan(data?.plan || null);
        setBillingStatus(data?.billingStatus || null);
        setUsage(data?.usage || 0);
        setUsageLimit(data?.usageLimit ?? null);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* 🔔 Trial 警告バナー */}
      {billingStatus === "trial" && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">現在トライアル期間中です</p>
          <p className="text-sm">
            プランを有効化しないと機能が停止する可能性があります。
          </p>
        </div>
      )}

      {/* プラン情報 */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold mb-2">現在のプラン</h2>
        <p>{plan ?? "未設定"}</p>
        <p className="text-sm text-gray-500">課金ステータス: {billingStatus ?? "-"}</p>
      </div>

      {/* 利用状況 */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold mb-2">利用状況</h2>
        <p>利用数: {usage}</p>
        <p>
          上限:{" "}
          {usageLimit === null ? "∞" : usageLimit}
        </p>
        {usageLimit !== null && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min((usage / usageLimit) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
