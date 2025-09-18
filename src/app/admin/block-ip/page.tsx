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
  const [loadingIps, setLoadingIps] = useState(false);

  const [countryCode, setCountryCode] = useState("");
  const [countryMessage, setCountryMessage] = useState("");
  const [countries, setCountries] = useState<BlockCountry[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loadingAvailableCountries, setLoadingAvailableCountries] = useState(false);

  // ✅ スピナー
  const Spinner = () => (
    <svg
      className="animate-spin h-4 w-4 text-gray-500"
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

  // ====== ブロックIP ======
  const fetchIps = async () => {
    setLoadingIps(true);
    try {
      const res = await fetch("/api/admin/block-ip/list");
      const data = await res.json();
      setIps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ブロックIP一覧取得エラー:", err);
      setIps([]);
    } finally {
      setLoadingIps(false);
    }
  };

  // ====== ブロックCountry ======
  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch("/api/admin/block-country/list");
      const data = await res.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("ブロックCountry一覧取得エラー:", err);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // ====== 利用可能な国一覧 (セレクト用) ======
  const fetchAvailableCountries = async () => {
    setLoadingAvailableCountries(true);
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
    } finally {
      setLoadingAvailableCountries(false);
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
        <div className="overflow-x-auto mt-6">
          {loadingIps ? (
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
                </tr>
              </thead>
              <tbody>
                {ips.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">
                      登録されたブロックIPはありません
                    </td>
                  </tr>
                ) : (
                  ips.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-200 text-xs text-gray-500 whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("ja-JP") : "-"}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 font-mono text-xs">{item.ip}</td>
                      <td className="px-4 py-3 border-b border-gray-200 text-xs">{item.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== ブロックCountry ===== */}
      <div>
        <h1 className="text-xl font-bold">ブロックCountry</h1>
        <div className="relative mt-4 max-w-md">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="border rounded-md px-3 py-2 w-full text-sm bg-white focus:outline-none appearance-none"
            disabled={loadingAvailableCountries}
          >
            {loadingAvailableCountries ? (
              <option>読み込み中...</option>
            ) : (
              <>
                <option value="">国を選択してください</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </>
            )}
          </select>

          {loadingAvailableCountries ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner />
            </div>
          ) : (
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          )}
        </div>

        <div className="overflow-x-auto mt-6">
          {loadingCountries ? (
            <div className="flex justify-center items-center py-20">
              <Spinner />
            </div>
          ) : (
            <table className="min-w-full bg-white text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-xs font-semibold text-gray-600">
                  <th className="px-4 py-3 border-b border-gray-200 text-left">登録日</th>
                  <th className="px-4 py-3 border-b border-gray-200 text-left">国コード</th>
                </tr>
              </thead>
              <tbody>
                {countries.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">
                      登録されたブロックCountryはありません
                    </td>
                  </tr>
                ) : (
                  countries.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-200 text-xs text-gray-500 whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("ja-JP") : "-"}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 font-mono text-xs">
                        {item.countryCode}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
