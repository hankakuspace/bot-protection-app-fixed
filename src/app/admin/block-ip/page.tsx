// src/app/admin/block-ip/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface BlockIp {
  id: string;
  ip: string;
  note: string;
  createdAt?: string;
}

interface BlockCountry {
  id: string;
  countryCode: string;
  createdAt?: string;
}

export default function BlockIpPage() {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [ips, setIps] = useState<BlockIp[]>([]);

  const [countryCode, setCountryCode] = useState("");
  const [countryMessage, setCountryMessage] = useState("");
  const [countries, setCountries] = useState<BlockCountry[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  // ====== ブロックIP ======
  const handleSubmitIp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const adminRes = await fetch("/api/admin/admin-ip/list");
      const adminIps = await adminRes.json();
      if (adminIps.some((a: any) => a.ip === ip)) {
        alert("管理者IPはブロックIPに登録できません");
        return;
      }

      const res = await fetch("/api/admin/block-ip/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, note }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("✅ ブロックIPを登録しました");
        setIp("");
        setNote("");
        fetchIps();
      } else {
        setMessage(data.error || "登録に失敗しました");
      }
    } catch (err) {
      console.error("ブロックIP登録エラー:", err);
      setMessage("エラーが発生しました");
    }
  };

  const fetchIps = async () => {
    try {
      const res = await fetch("/api/admin/block-ip/list");
      const data = await res.json();
      setIps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ブロックIP一覧取得エラー:", err);
      setIps([]);
    }
  };

  const handleDeleteIp = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;

    try {
      const res = await fetch("/api/admin/delete-ip", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "block" }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchIps();
      } else {
        alert("削除失敗: " + (data.error || "不明なエラー"));
      }
    } catch (err) {
      console.error("ブロックIP削除エラー:", err);
      alert("削除時にエラー発生");
    }
  };

  // ====== ブロックCountry ======
  const handleSubmitCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setCountryMessage("");

    try {
      const res = await fetch("/api/admin/block-country/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode }),
      });
      const data = await res.json();
      if (data.ok) {
        setCountryMessage("✅ ブロックCountryを登録しました");
        setCountryCode("");
        fetchCountries();
      } else {
        setCountryMessage(data.error || "登録に失敗しました");
      }
    } catch (err) {
      console.error("ブロックCountry登録エラー:", err);
      setCountryMessage("エラーが発生しました");
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await fetch("/api/admin/block-country/list");
      const data = await res.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ブロックCountry一覧取得エラー:", err);
      setCountries([]);
    }
  };

  const handleDeleteCountry = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;

    try {
      const res = await fetch("/api/admin/delete-ip", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: "country" }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchCountries();
      } else {
        alert("削除失敗: " + (data.error || "不明なエラー"));
      }
    } catch (err) {
      console.error("ブロックCountry削除エラー:", err);
      alert("削除時にエラー発生");
    }
  };

  // 利用可能な国一覧（アクセスログから取得）
  const fetchAvailableCountries = async () => {
    try {
      const res = await fetch("/api/admin/logs?limit=500");
      const data = await res.json();
      const logs = data.logs || [];
      const uniqueCountries: string[] = Array.from(
        new Set(
          logs.map((l: any) => String(l.country || "")).filter(Boolean)
        )
      );
      setAvailableCountries(uniqueCountries);
    } catch (err) {
      console.error("利用可能国一覧取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchIps();
    fetchCountries();
    fetchAvailableCountries();
  }, []);

  return (
    <div className="space-y-10">
      {/* ===== ブロックIP ===== */}
      <div>
        <h1 className="text-xl font-bold">ブロックIP</h1>
        {/* 追加フォーム */}
        <form onSubmit={handleSubmitIp} className="space-y-4 max-w-md mt-4">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="例: 192.168.0.1 または IPv6"
            className="border rounded-lg p-2 w-full text-sm"
          />
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
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs font-semibold text-gray-600">
                <th className="px-4 py-3 border-b border-gray-200 text-left">
                  登録日
                </th>
                <th className="px-4 py-3 border-b border-gray-200 text-left">
                  保存されたIP
                </th>
                <th className="px-4 py-3 border-b border-gray-200 text-left">
                  メモ
                </th>
                <th className="px-4 py-3 border-b border-gray-200 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {ips.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                  >
                    登録されたブロックIPはありません
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
                        <span className="inline-block bg-red-100 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                          ブロック
                        </span>
                        <span>{item.ip}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-xs">
                      {item.note}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-left">
                      <button
                        onClick={() => handleDeleteIp(item.id)}
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
        </div>
      </div>

      {/* ===== ブロックCountry ===== */}
      <div>
        <h1 className="text-xl font-bold">ブロックCountry</h1>
        {/* 追加フォーム */}
        <form
          onSubmit={handleSubmitCountry}
          className="space-y-4 max-w-md mt-4"
        >
          <div className="relative">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="border rounded-md px-3 py-2 w-full text-sm bg-white focus:outline-none appearance-none"
            >
              <option value="">国を選択してください</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
            disabled={!countryCode}
          >
            登録
          </button>
        </form>
        {countryMessage && <p className="text-sm mt-2">{countryMessage}</p>}

        {/* 一覧テーブル */}
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs font-semibold text-gray-600">
                <th className="px-4 py-3 border-b border-gray-200 text-left">
                  登録日
                </th>
                <th className="px-4 py-3 border-b border-gray-200 text-left">
                  国コード
                </th>
                <th className="px-4 py-3 border-b border-gray-200 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {countries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                  >
                    登録されたブロックCountryはありません
                  </td>
                </tr>
              ) : (
                countries.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-200 text-xs text-gray-500 whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("ja-JP")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-mono text-xs">
                      {item.countryCode}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 text-left">
                      <button
                        onClick={() => handleDeleteCountry(item.id)}
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
        </div>
      </div>
    </div>
  );
}
