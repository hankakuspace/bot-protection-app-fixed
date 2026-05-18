// src/app/blocked/page.tsx
export default function BlockedPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-4 inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700">
            Access Denied
          </div>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
            このアクセスはブロックされました
          </h1>

          <p className="mb-3 text-base leading-7 text-gray-700">
            あなたのIPアドレス、またはこのアクセス元は管理設定により拒否されています。
          </p>

          <p className="text-sm leading-6 text-gray-600">
            誤検知の可能性がある場合は、管理者へ連絡してください。
          </p>
        </div>
      </div>
    </main>
  );
}
