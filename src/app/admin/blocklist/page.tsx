'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client'; // ← クライアントSDKを利用

type BlockCountry = { id: string; enabled: boolean; note?: string; updatedAt?: any };
type BlockIP = { id: string; enabled: boolean; note?: string; updatedAt?: any };
type TabKey = 'country' | 'ip';

export default function BlocklistPage() {
  const [tab, setTab] = useState<TabKey>('country');
  const [countries, setCountries] = useState<BlockCountry[]>([]);
  const [ips, setIps] = useState<BlockIP[]>([]);
  const [inputCountry, setInputCountry] = useState('');
  const [inputIP, setInputIP] = useState('');
  const [note, setNote] = useState('');

  // 初回ロード
  useEffect(() => {
    const load = async () => {
      const [cs, is] = await Promise.all([
        getDocs(collection(db, 'block_countries')),
        getDocs(collection(db, 'block_ips')),
      ]);
      setCountries(
        cs.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .sort((a, b) => a.id.localeCompare(b.id))
      );
      setIps(
        is.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .sort((a, b) => a.id.localeCompare(b.id))
      );
    };
    load();
  }, []);

  const addCountry = async () => {
    const id = inputCountry.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(id)) return alert('ISO 国コード2文字で入力してください（例: JP, US）');
    await setDoc(doc(db, 'block_countries', id), {
      enabled: true,
      note: note || '',
      updatedAt: serverTimestamp(),
    });
    setCountries((prev) => [{ id, enabled: true, note }, ...prev.filter((c) => c.id !== id)]);
    setInputCountry('');
    setNote('');
  };

  const addIP = async () => {
    const id = inputIP.trim();
    if (!id) return alert('IPを入力してください（IPv4/IPv6 可）');
    await setDoc(doc(db, 'block_ips', id), {
      enabled: true,
      note: note || '',
      updatedAt: serverTimestamp(),
    });
    setIps((prev) => [{ id, enabled: true, note }, ...prev.filter((p) => p.id !== id)]);
    setInputIP('');
    setNote('');
  };

  const toggleCountry = async (id: string, enabled: boolean) => {
    await updateDoc(doc(db, 'block_countries', id), { enabled, updatedAt: serverTimestamp() });
    setCountries((prev) => prev.map((c) => (c.id === id ? { ...c, enabled } : c)));
  };

  const toggleIP = async (id: string, enabled: boolean) => {
    await updateDoc(doc(db, 'block_ips', id), { enabled, updatedAt: serverTimestamp() });
    setIps((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
  };

  const removeCountry = async (id: string) => {
    if (!confirm(`${id} を削除しますか？`)) return;
    await deleteDoc(doc(db, 'block_countries', id));
    setCountries((prev) => prev.filter((c) => c.id !== id));
  };

  const removeIP = async (id: string) => {
    if (!confirm(`${id} を削除しますか？`)) return;
    await deleteDoc(doc(db, 'block_ips', id));
    setIps((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">ブロック設定</h1>

      {/* タブ切替 */}
      <div className="mt-4 inline-flex rounded-lg overflow-hidden border">
        <button
          onClick={() => setTab('country')}
          className={`px-4 py-2 text-sm ${tab === 'country' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          国をブロック
        </button>
        <button
          onClick={() => setTab('ip')}
          className={`px-4 py-2 text-sm border-l ${tab === 'ip' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          IPをブロック
        </button>
      </div>

      {/* 追加フォーム */}
      <div className="mt-4 p-4 rounded border bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-end">
        {tab === 'country' ? (
          <>
            <div>
              <label className="block text-sm mb-1">国コード（ISO-3166-1 alpha-2）</label>
              <input
                value={inputCountry}
                onChange={(e) => setInputCountry(e.target.value)}
                placeholder="JP / US など"
                className="border rounded px-2 py-1 w-40"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">メモ（任意）</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="理由など"
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <button
              onClick={addCountry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              追加
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <label className="block text-sm mb-1">IPアドレス</label>
              <input
                value={inputIP}
                onChange={(e) => setInputIP(e.target.value)}
                placeholder="1.2.3.4 または IPv6"
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">メモ（任意）</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="理由など"
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <button
              onClick={addIP}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              追加
            </button>
          </>
        )}
      </div>

      {/* 一覧 */}
      {tab === 'country' ? (
        <table className="mt-4 w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Country</th>
              <th className="p-2 border">Enabled</th>
              <th className="p-2 border">Note</th>
              <th className="p-2 border w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{c.id}</td>
                <td className="p-2 border">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!c.enabled}
                      onChange={(e) => toggleCountry(c.id, e.target.checked)}
                    />
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${
                        c.enabled
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      {c.enabled ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </td>
                <td className="p-2 border">{c.note || '-'}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => removeCountry(c.id)}
                    className="px-2 py-1 rounded border hover:bg-red-50"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {countries.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={4}>
                  なし
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <table className="mt-4 w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">IP</th>
              <th className="p-2 border">Enabled</th>
              <th className="p-2 border">Note</th>
              <th className="p-2 border w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {ips.map((p) => (
              <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border font-mono">{p.id}</td>
                <td className="p-2 border">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!p.enabled}
                      onChange={(e) => toggleIP(p.id, e.target.checked)}
                    />
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${
                        p.enabled
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      {p.enabled ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </td>
                <td className="p-2 border">{p.note || '-'}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => removeIP(p.id)}
                    className="px-2 py-1 rounded border hover:bg-red-50"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {ips.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={4}>
                  なし
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
