// src/app/admin/list-ip/page.tsx
"use client";

import React, { useEffect, useState } from "react";

export default function ListIpPage() {
  const [ips, setIps] = useState<string[]>([]);

  useEffect(() => {
    const fetchIps = async () => {
      try {
        const res = await fetch("/api/admin/list-ip");
        const data = await res.json();
        setIps(data.ips || []);
      } catch (err) {
        console.error("IP取得失敗", err);
      }
    };
    fetchIps();
  }, []);

  return (
    <div className="p-6">
      {/* 共通ナビ */}

      <h1 className="text-xl font-bold mb-4">登録済みIP一覧</h1>
      {ips.length > 0 ? (
        <ul className="list-disc pl-6">
          {ips.map((ip, idx) => (
            <li key={idx}>{ip}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">まだIPは登録されていません。</p>
      )}
    </div>
  );
}
