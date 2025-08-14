'use client';

import { useEffect, useMemo, useState } from 'react';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_DASH_KEY || ""; // クライアントから送る場合

export default function AppHome() {
  const [shop, setShop] = useState('');
  const [postStatus, setPostStatus] = useState<'idle'|'ok'|'ng'>('idle');

  // IP 管理
  const [ips, setIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const headers = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ADMIN_KEY) h['x-admin-key'] = ADMIN_KEY;
    return h;
  }, []);

  async function refresh() {
    const res = await fetch('/api/admin/ip-blocks', { headers });
    const json = await res.json();
    if (json.ok) setIps(json.blocked || []);
  }

  async function add() {
    const ip = newIp.trim();
    if (!ip) return;
    const res = await fetch('/api/admin/ip-blocks', { method: 'POST', headers, body: JSON.stringify({ ip }) });
    const json = await res.json();
    if (json.ok) {
      setIps(json.blocked || []);
      setNewIp('');
    }
  }

  async function remove(ip: string) {
    const res = await fetch('/api/admin/ip-blocks', { method: 'DELETE', headers, body: JSON.stringify({ ip }) });
    const json = await res.json();
    if (json.ok) setIps(json.blocked || []);
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setShop((sp.get('shop') || '').toLowerCase());
    refresh();
  }, []); // eslint-disable-line

  return (
    <main className="p-6" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 className="text-2xl font-semibold">Bot Protection — Dashboard</h1>
      <p className="text-sm opacity-70 mt-1">
        {shop ? <>Installed on <b>{shop}</b></> : 'Shop context not detected'}
      </p>

      <section className="mt-6 grid gap-4">
        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Health check</h2>
          <p className="text-sm opacity-70">App Proxy 経由の疎通確認（GET/POST）</p>
          <div className="mt-3 flex gap-8">
            <a className="underline"
               href="https://be-search.biz/apps/bpp-20250814/ping?echo=1&cb=now"
               target="_blank" rel="noreferrer">
              Open GET /ping (new tab)
            </a>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('https://be-search.biz/apps/bpp-20250814/ping?cb=' + Date.now(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hello: 'world' })
                  });
                  setPostStatus(res.ok ? 'ok' : 'ng');
                } catch {
                  setPostStatus('ng');
                }
              }}
              className="rounded-lg border px-3 py-1.5"
            >
              POST /ping を送る
            </button>
            <span className="text-sm opacity-70">
              {postStatus === 'idle' ? '' : postStatus === 'ok' ? 'ok:true' : 'error'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-medium">IP Blocks</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="例: 203.0.113.7 / 2001:db8::1"
              className="border rounded-lg px-3 py-1.5 w-64"
            />
            <button onClick={add} className="rounded-lg border px-3 py-1.5">追加</button>
            <button onClick={refresh} className="rounded-lg border px-3 py-1.5">更新</button>
          </div>

          <ul className="mt-4 grid gap-2">
            {ips.length === 0 && <li className="text-sm opacity-60">（まだ登録なし）</li>}
            {ips.map(ip => (
              <li key={ip} className="flex items-center justify-between border rounded-lg px-3 py-1.5">
                <span>{ip}</span>
                <button onClick={() => remove(ip)} className="text-red-600 underline">削除</button>
              </li>
            ))}
          </ul>
          <p className="text-xs opacity-60 mt-3">
            ※ 現状は簡易 JSON 保存（/tmp）。本番永続化は後ほど Vercel Blob 等に置き換え予定。
          </p>
        </div>
      </section>
    </main>
  );
}
