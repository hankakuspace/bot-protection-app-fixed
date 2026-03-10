// src/app/blocked/page.tsx
export default function BlockedPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <div className="mb-4 inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
            Access Denied
          </div>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-red-700">
            このアクセスはブロックされました
          </h1>

          <p className="mb-3 text-base leading-7 text-gray-700">
            あなたのIPアドレス、またはこのアクセス元は管理設定により拒否されています。
          </p>

          <p className="mb-6 text-sm leading-6 text-gray-600">
            誤検知の可能性がある場合は、管理者へ連絡してください。
          </p>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-800">確認ポイント</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>現在のネットワーク環境からのアクセスが制限されていないか</li>
              <li>VPN / Proxy / CDN 経由のIPが対象になっていないか</li>
              <li>Shopify App Proxy 経由ではなく直アクセスになっていないか</li>
            </ul>
          </div>

          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              トップへ戻る
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
