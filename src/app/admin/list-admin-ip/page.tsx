// src/app/admin/list-admin-ip/page.tsx
"use client";

import { useEffect, useState } from "react";

interface AdminIp {
  id: string;
  ip: string;
  note: string;
  createdAt?: string;
}

export default function ListAdminIpPage() {
  const [ips, setIps] = useState<AdminIp[]>([]);

  useEffect(() => {
    const fetchIps = async () => {
      const res = await fetch("/api/admin/list-admin-ip");
      const data = await res.json();
      setIps(data);
    };
    fetchIps();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">管理者IP一覧</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">IP</th>
            <th className="p-2 border">Note</th>
            <th className="p-2 border">登録日</th>
          </tr>
        </thead>
        <tbody>
          {ips.map((item) => (
            <tr key={item.id}>
              <td className="p-2 border">{item.ip}</td>
              <td className="p-2 border">{item.note}</td>
              <td className="p-2 border">
                {item.createdAt || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
