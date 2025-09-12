// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import "flag-icons/css/flag-icons.min.css"; // ✅ 追加

interface AccessLog {
  id: string;
  ip: string;
  country: string;
  allowedCountry?: boolean;
  blocked?: boolean;
  isAdmin?: boolean;
  userAgent?: string;
  timestamp: string | null;
}

export default function LogsPage() {
  // ... 省略（state & fetch 部分は既存のまま）

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  // ✅ flag-icons 用: 国旗 + コード
  const CountryCell = ({ code }: { code: string }) => {
    if (!code) return <span>❓</span>;
    return (
      <div className="flex items-center gap-2">
        <span className={`fi fi-${code.toLowerCase()}`} />
        <span>{code}</span>
      </div>
    );
  };

  // ... フィルタ処理などはそのまま

  return (
    <div className="p-6">
      <AdminNav />
      <h1 className="text-xl font-bold mb-4">アクセスログ</h1>

      {/* ... 操作バーは省略 ... */}

      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Timestamp</th>
            <th className="border px-2 py-1">IP</th>
            <th className="border px-2 py-1">Country</th>
            <th className="border px-2 py-1">Allowed</th>
            <th className="border px-2 py-1">Blocked</th>
            <th className="border px-2 py-1">isAdmin</th>
            <th className="border px-2 py-1">UserAgent</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id}>
              <td className="border px-2 py-1">{formatDate(log.timestamp)}</td>
              <td className="border px-2 py-1 font-mono text-xs">{log.ip}</td>
              <td className="border px-2 py-1">
                <CountryCell code={log.country} />
              </td>
              <td className="border px-2 py-1">{log.allowedCountry ? "✅" : "❌"}</td>
              <td className="border px-2 py-1">{log.blocked ? "🚫" : "—"}</td>
              <td className="border px-2 py-1">{log.isAdmin ? "👑" : "—"}</td>
              <td className="border px-2 py-1 max-w-xs truncate">{log.userAgent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
