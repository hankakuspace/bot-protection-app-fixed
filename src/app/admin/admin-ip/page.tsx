// src/app/admin/admin-ip/page.tsx
"use client";

import { useState, useEffect } from "react";

interface AdminIp {
  id: string;
  ip: string;
  note: string;
  createdAt?: string;
}

export default function AdminIpPage() {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [ips, setIps] = useState<AdminIp[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ スピナー
  const Spinner = () => (
    <svg
      className="animate-spin h-6 w-6 text-gray-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 1 0-8 8v2a10 10 0 1 1 0-20z"
      />
    </svg>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/admin/admin-ip/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, note }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ 管理者IPを登録しました（保存値: ${data.ip}）`);
        setIp("");
        setNote("");
        fetchIps();
      } else {
        setMessage(data.error || "登録に失敗しました");
      }
    } catch (err) {
      console.error("管理者IP登録エラー:", err);
      setMessage("エラーが発生しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      const res = await fetch("/api/admin/delete-ip", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "admin" }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchIps();
      } else {
        alert("削除失敗: " + (data.error || "不明なエラー"));
      }
    } catch (err) {
      console.error("管理者IP削除エラー:", err);
      alert("削除時にエラー発生");
    }
  };

  const fetchIps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admin-ip/list");
      const data = await res.json();
      setIps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("管理者IP一覧取得エラー:", err);
      setIps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-4">管理者IP</h1>

      {/* 追加フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="例: 192.168.0.1 または IPv6"
          className="border rounded-lg p-2 w-full text-sm"
        />
        <p className="text-xs text-gray-500">
          IPv6アドレスを登録した場合は、自動的に /64 プレフィックスで保存されます
        </p>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="メモ（任意）"
          className="border rounded-lg p-2 w-full text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
        >
          登録
        </button>
      </form>
      {message && <p className="text-sm mt-2">{message}</p>}

      {/* 一覧テーブル */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        ) : (
          <table className="min-w-full bg-white text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs font-semibold text-gray-600">
                <th className="px-4 py-3 border-b border-gray-200 text-left">登録日</th>
                <th className="px-4 py-3 border-b border-gray-200 text-left">保存されたIP</th>
                <th className="px-4 py-3 border-b border-gray-200 text-left">メモ</th>
                <th className="px-4 py-3 border-b border-gray-200 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {ips.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                    登録された管理者IPはありません
                  </td>
                </tr>
              ) : (
                ips.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-200 text-xs text-gray-500 whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("ja-JP")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>{item.ip}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-xs">
                      {item.note}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-left">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 text-xs text-gray-700"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
