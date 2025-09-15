// src/app/admin/blocked/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { clientDb } from "@/lib/firebase-client"; // ✅ 修正: db → clientDb

type BlockCountry = {
  id: string;
  enabled: boolean;
  note?: string;
  updatedAt?: any;
};

export default function BlockedPage() {
  const [countries, setCountries] = useState<BlockCountry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(clientDb, "blocked_countries"));
      const list: BlockCountry[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<BlockCountry, "id">),
      }));
      setCountries(list);
    };

    fetchData();
  }, []);

  return (
    <div className="flex">
      <main className="flex-1 p-6">
        <h1 className="text-xl font-bold mb-4">ブロック国リスト</h1>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">国コード</th>
              <th className="p-2 border">有効</th>
              <th className="p-2 border">備考</th>
              <th className="p-2 border">更新日時</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tr key={country.id}>
                <td className="p-2 border">{country.id}</td>
                <td className="p-2 border">
                  {country.enabled ? "✅" : "❌"}
                </td>
                <td className="p-2 border">{country.note || "-"}</td>
                <td className="p-2 border">
                  {country.updatedAt
                    ? new Date(country.updatedAt.seconds * 1000).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
