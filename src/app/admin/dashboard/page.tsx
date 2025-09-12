// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [usage, setUsage] = useState<{ usageCount: number; limit: number; overLimit: boolean } | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch(`/api/admin/usage?shop=ruhra-store.myshopify.com`);
        const data = await res.json();
        setUsage(data);
      } catch (err) {
        console.error("fetchUsage error:", err);
      }
    }
    fetchUsage();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード</h1>

      {usage ? (
        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="text-lg font-semibold mb-2">API利用状況</h2>
          <p>
            今月の利用数: <span className="font-bold">{usage.usageCount}</span> /{" "}
            <span className="font-bold">{usage.limit}</span>
          </p>
          {usage.overLimit && (
            <p className="text-red-500 font-bold mt-2">
              上限を超えています。プランアップをご検討ください。
            </p>
          )}
        </div>
      ) : (
        <p>読み込み中...</p>
      )}
    </div>
  );
}
