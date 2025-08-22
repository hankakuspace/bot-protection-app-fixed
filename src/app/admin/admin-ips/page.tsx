'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

type AdminIpRow = {
  id: string;
  ip: string;
  note?: string;
  createdAt?: { seconds: number; nanoseconds: number } | number;
};

const COLL = 'admin_ips';

const ipRegex =
  /^(?:((25[0-5]|2[0-4]\d|1?\d?\d)(\.(?!$)|$)){4}|(::1)|([a-fA-F0-9:]+:+[a-fA-F0-9]+))$/;

export default function AdminIpsPage() {
  const [rows, setRows] = useState<AdminIpRow[]>([]);
  const [ip, setIp] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // リアルタイム購読
  useEffect(() => {
    const q = query(collection(db, COLL), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: AdminIpRow[] = snap.docs.map((d) => {
        const v: any = d.data();
        return {
          id: d.id,
          ip: v.ip,
          note: v.note,
          createdAt:
            typeof v.createdAt === 'number'
              ? v.createdAt
              : v.createdAt?.toMillis
              ? v.createdAt.toMillis()
              : undefined,
        };
      });
      setRows(list);
    });
    return () => unsub();
  }, []);

  const canAdd = ipRegex.test(ip.trim());

  const handleAdd = async () => {
    setErr(null);
    if (!canAdd) {
      setErr('IPの形式が正しくありません');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, COLL), {
        ip: ip.trim(),
        note: note.trim() || 'manual',
        createdAt: serverTimestamp(),
      });
      setIp('');
      setNote('');
    } catch (e: any) {
      setErr(e?.message || '追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, COLL, id));
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  const header = useMemo(
    () => (
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="text-xl font-bold">Admin IPs</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="例: 203.0.113.10"
            className="border rounded px-2 py-1 text-sm min-w-[220px]"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="メモ（任意）"
            className="border rounded px-2 py-1 text-sm min-w-[220px]"
          />
          <button
            onClick={handleAdd}
            disabled={!canAdd || loading}
            className="border rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            Add
          </button>
          {/* 戻るリンク */}
          <Link
            href="/admin/logs"
            className="border rounded px-3 py-1 text-sm inline-flex items-center"
            title="アクセスログに戻る"
          >
            Back to Logs
          </Link>
        </div>
      </div>
    ),
    [ip, note, canAdd, loading]
  );

  return (
    <div className="p-6">
      {header}
      {err && <div className="mt-2 text-sm text-red-600">{err}</div>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Timestamp</th>
              <th className="text-left p-2">IP</th>
              <th className="text-left p-2">Note</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">
                  {r.createdAt
                    ? new Date(
                        typeof r.createdAt === 'number'
                          ? r.createdAt
                          : (r.createdAt as any)
                      ).toLocaleString()
                    : '-'}
                </td>
                <td className="p-2">{r.ip}</td>
                <td className="p-2">{r.note || '-'}</td>
                <td className="p-2">
                  <button
                    className="border rounded px-3 py-1 text-sm disabled:opacity-50"
                    onClick={() => handleDelete(r.id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-center opacity-70" colSpan={4}>
                  No admin IPs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
