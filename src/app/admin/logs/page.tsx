// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getAccessLogs } from "../../../lib/get-access-logs";

type AccessLog = {
  id: string;
  timestamp?: {
    toDate?: () => Date;
  };
  ip?: string;
  country?: string;
  isAdmin?: boolean;
  blocked?: boolean;
  userAgent?: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [adminOnly, setAdminOnly] = useState(false);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getAccessLogs();
        setLogs(Array.isArray(fetched) ? fetched : []);
      } catch (err) {
        console.error("logs page error:", err);
        setError("ログの取得に失敗しました");
      }
    })();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (countryFilter && (log.country || "UNKNOWN") !== countryFilter)
      return false;
    if (adminOnly && !log.isAdmin) return false;
    if (blockedOnly && !log.blocked) return false;
    return true;
  });

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">アクセスログ一覧</h1>

      {error ? <p className="mb-4 text-red-600">{error}</p> : null}

      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <label>
          国コード:
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="ml-2 border px-2 py-1"
          >
            <option value="">すべて</option>
            <option value="JP">JP</option>
            <option value="US">US</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={adminOnly}
            onChange={(e) => setAdminOnly(e.target.checked)}
            className="mr-1"
          />
          管理者のみ
        </label>

        <label>
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={(e) => setBlockedOnly(e.target.checked)}
            className="mr-1"
          />
          ブロック対象のみ
        </label>
      </div>

      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">日時</th>
            <th className="border px-2 py-1">IP</th>
            <th className="border px-2 py-1">国</th>
            <th className="border px-2 py-1">管理者</th>
            <th className="border px-2 py-1">ブロック</th>
            <th className="border px-2 py-1">UA</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.length === 0 ? (
            <tr>
              <td className="border px-2 py-3 text-center" colSpan={6}>
                ログがありません
              </td>
            </tr>
          ) : (
            filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className="border px-2 py-1">
                  {log.timestamp?.toDate?.()?.toLocaleString?.() || "-"}
                </td>
                <td className="border px-2 py-1">{log.ip || "-"}</td>
                <td className="border px-2 py-1">{log.country || "UNKNOWN"}</td>
                <td className="border px-2 py-1">{log.isAdmin ? "✅" : ""}</td>
                <td className="border px-2 py-1">{log.blocked ? "🚫" : ""}</td>
                <td className="border px-2 py-1">
                  {log.userAgent ? `${log.userAgent.slice(0, 30)}...` : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="force-tailwind-debug">Tailwind デバッグ表示</div>
    </main>
  );
}
