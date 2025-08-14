'use client';

import { useEffect, useState } from 'react';

export default function AppHome() {
  const [shop, setShop] = useState<string>('');
  const [status, setStatus] = useState<'idle'|'ok'|'ng'>('idle');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setShop((sp.get('shop') || '').toLowerCase());
  }, []);

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
                  setStatus(res.ok ? 'ok' : 'ng');
                } catch {
                  setStatus('ng');
                }
              }}
              className="rounded-lg border px-3 py-1.5"
            >
              POST /ping を送る
            </button>
            <span className="text-sm opacity-70">
              {status === 'idle' ? '' : status === 'ok' ? 'ok:true' : 'error'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Management</h2>
          <p className="text-sm opacity-70">
            ここに IP ブロック等の設定UIを載せます（後述の再利用プランですぐ移植可）。
          </p>
        </div>
      </section>
    </main>
  );
}
