"use client";

import { useEffect, useState } from "react";

export default function ListIpPage() {
  const [blocked, setBlocked] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    const fetchIps = async () => {
      const res = await fetch("/api/admin/list-ip");
      const data = await res.json();
      setBlocked(data.blocked || []);
      setAdmins(data.admins || []);
    };
    fetchIps();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">IPリスト</h1>

      {/* 管理者リスト */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">管理者リスト</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">IPアドレス</th>
              <th className="border px-4 py-2">登録日時</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a, i) => (
              <tr key={i}>
                <td className="border px-4 py-2">{a.ip}</td>
                <td className="border px-4 py-2">{a.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ブロックリスト */}
      <div>
        <h2 className="text-xl font-semibold mb-2">ブロックリスト</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">IPアドレス</th>
              <th className="border px-4 py-2">登録日時</th>
            </tr>
          </thead>
          <tbody>
            {blocked.map((b, i) => (
              <tr key={i}>
                <td className="border px-4 py-2">{b.ip}</td>
                <td className="border px-4 py-2">{b.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
