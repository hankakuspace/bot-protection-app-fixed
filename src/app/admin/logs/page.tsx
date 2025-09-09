// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/admin/logs");
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e) {
        console.error("ログ取得失敗:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      {/* ナビゲーションバー */}
      <nav className="mb-6 border-b border-gray-200">
        <ul className="flex space-x-6">
          <li>
            <Link
              href="/admin/add-ip"
              className={`pb-2 ${
                pathname === "/admin/add-ip"
                  ? "border-b-2 border-blue-500 font-semibold"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              IP追加
            </Link>
          </li>
          <li>
            <Link
              href="/admin/list-ip"
              className={`pb-2 ${
                pathname === "/admin/list-ip"
                  ? "border-b-2 border-blue-500 font-semibold"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              ブロックリスト
            </Link>
          </li>
          <li>
            <Link
              href="/admin/logs"
              className={`pb-2 ${
                pathname === "/admin/logs"
                  ? "border-b-2 border-blue-500 font-semibold"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              アクセスログ
            </Link>
          </li>
        </ul>
      </nav>

      {/* コンテンツ */}
      <h1 className="text-xl font-bold mb-4">アクセスログ</h1>
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1">IP</th>
              <th className="border border-gray-300 px-2 py-1">国</th>
              <th className="border border-gray-300 px-2 py-1">許可国</th>
              <th className="border border-gray-300 px-2 py-1">ブロック</th>
              <th className="border border-gray-300 px-2 py-1">管理者</th>
              <th className="border border-gray-300 px-2 py-1">UA</th>
              <th className="border border-gray-300 px-2 py-1">日時</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="border border-gray-300 px-2 py-1">{log.ip}</td>
                <td className="border border-gray-300 px-2 py-1">{log.country}</td>
                <td className="border border-gray-300 px-2 py-1">
                  {log.allowedCountry ? "✅" : "❌"}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {log.blocked ? "🚫" : "—"}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {log.isAdmin ? "👑" : "—"}
                </td>
                <td className="border border-gray-300 px-2 py-1">{log.userAgent}</td>
                <td className="border border-gray-300 px-2 py-1">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
