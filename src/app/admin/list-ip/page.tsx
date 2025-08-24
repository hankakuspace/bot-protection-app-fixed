// src/app/admin/list-ip/page.tsx
"use client";

import React, { useEffect, useState } from "react";

export default function ListIpPage() {
  const [ips, setIps] = useState<string[]>([]);

  useEffect(() => {
    const fetchIps = async () => {
      const res = await fetch("/api/admin/list-ip");
      const data = await res.json();
      setIps(data.ips || []);
    };
    fetchIps();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">登録済みIP一覧</h1>
      <ul className="list-disc pl-6">
        {ips.map((ip, idx) => (
          <li key={idx}>{ip}</li>
        ))}
      </ul>
    </div>
  );
}
