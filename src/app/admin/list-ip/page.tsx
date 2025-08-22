"use client";

import { useEffect, useState } from "react";

export default function ListIpPage() {
  const [blocked, setBlocked] = useState<string[]>([]);

  const fetchIps = async () => {
    try {
      const res = await fetch("/api/admin/list-ip");
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      setBlocked(data.blocked || []);
    } catch (err) {
      console.error("list-ip fetch error:", err);
      alert("リスト取得に失敗しました");
    }
  };

  const handleDelete = async (ip: string) => {
    try {
      const res = await fetch("/api/admin/delete-ip", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (data.ok) {
        setBlocked(data.blocked || []);
      } else {
        alert(`削除失敗: ${data.error}`);
      }
    } catch (err) {
      console.error("delete-ip error:", err);
      alert("削除に失敗しました");
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">ブロックリスト</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">IPアドレス</th>
            <th className="border px-4 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {blocked.map((ip) => (
            <tr key={ip}>
              <td className="border px-4 py-2">{ip}</td>
              <td className="border px-4 py-2 text-center">
                <button
                  onClick={() => handleDelete(ip)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
          {blocked.length === 0 && (
            <tr>
              <td colSpan={2} className="text-center py-4 text-gray-500">
                登録されたIPはありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
