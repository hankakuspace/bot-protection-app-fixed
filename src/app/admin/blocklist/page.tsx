'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase-client'; // ← firebase-client に変更
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

type LogRow = {
  id: string;
  ip: string;
  country?: string;
  isAdmin?: boolean;
  blocked?: boolean;
  userAgent?: string;
  timestamp?: any;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'access_logs'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setLogs(list);
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">アクセスログ</h1>
      <table className="mt-4 w-full text-sm border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">IP</th>
            <th className="p-2 border">Country</th>
            <th className="p-2 border">Admin</th>
            <th className="p-2 border">Blocked</th>
            <th className="p-2 border">UserAgent</th>
            <th className="p-2 border">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border font-mono">{log.ip}</td>
              <td className="p-2 border">{log.country || '-'}</td>
              <td className="p-2 border">{log.isAdmin ? '✅' : ''}</td>
              <td className="p-2 border">{log.blocked ? '🚫' : ''}</td>
              <td className="p-2 border truncate max-w-xs">{log.userAgent || '-'}</td>
              <td className="p-2 border">
                {log.timestamp?.toDate
                  ? log.timestamp.toDate().toLocaleString()
                  : log.timestamp || '-'}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No logs
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
