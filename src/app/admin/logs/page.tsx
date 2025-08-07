'use client';

import { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import FilterBar, { FilterOptions } from '@/components/FilterBar';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({
    country: '',
    isAdmin: false,
    blocked: false,
  });

  useEffect(() => {
    const fetchLogs = async () => {
      const db = getFirestore(app);
      const snapshot = await getDocs(collection(db, 'access_logs'));
      const data = snapshot.docs.map((doc) => doc.data());
      setLogs(data);
    };
    fetchLogs();
  }, []);

  // ユニークな国コードリスト
  const countries = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.country) set.add(log.country);
    });
    return Array.from(set).sort();
  }, [logs]);

  // フィルタ適用
  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (filter.country && log.country !== filter.country) return false;
      if (filter.isAdmin && !log.isAdmin) return false;
      if (filter.blocked && !log.blocked) return false;
      return true;
    });
  }, [logs, filter]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">アクセスログ</h1>
      <FilterBar countries={countries} filter={filter} onChange={setFilter} />

      <table className="mt-4 w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">IP</th>
            <th className="p-2 border">Country</th>
            <th className="p-2 border">isAdmin</th>
            <th className="p-2 border">Blocked</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((log, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border">{log.ip}</td>
              <td className="p-2 border">{log.country}</td>
              <td className="p-2 border">{String(log.isAdmin)}</td>
              <td className="p-2 border">{String(log.blocked)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
