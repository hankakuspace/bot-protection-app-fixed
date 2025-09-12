// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";

type UsageData = {
  shop: string;
  plan: string;
  yearMonth: string;
  usageCount: number;
  limit: number | "unlimited";
  overLimit: boolean;
};

export default function DashboardPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plan, setPlan] = useState<string>("Lite");
  const shop = "ruhra-store.myshopify.com";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/usage?shop=${shop}`);
        const data = await res.json();
        setUsage(data);

        const resPlan = await fetch(`/api/admin/plan?shop=${shop}`);
        const dataPlan = await resPlan.json();
        setPlan(dataPlan.plan);
      } catch (err) {
        console.error("fetch error:", err);
      }
    }
    fetchData();
  }, []);

  async function updatePlan(newPlan: string) {
    try {
      await fetch("/api/admin/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan: newPlan }),
      });
      setPlan(newPlan);
    } catch (err) {
      console.error("updatePlan error:", err);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード</h1>

      {usage ? (
        <div className="border rounded-lg p-4 bg-white shadow space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">API利用状況</h2>
            <p>
              今月の利用数:{" "}
              <span className="font-bold">{usage.usageCount}</span> /{" "}
              <span className="font-bold">
                {usage.limit === "unlimited" ? "無制限" : usage.limit}
              </span>
            </p>
            {usage.overLimit && (
              <p className="text-red-500 font-bold mt-2">
                上限を超えています。プランアップをご検討ください。
              </p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">プラン設定</h2>
            <select
              value={plan}
              onChange={(e) => updatePlan(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="Lite">Lite</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
            <p className="mt-2">現在のプラン: <span className="font-bold">{plan}</span></p>
          </div>
        </div>
      ) : (
        <p>読み込み中...</p>
      )}
    </div>
  );
}
