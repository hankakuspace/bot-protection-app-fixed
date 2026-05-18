// src/app/admin/page.tsx
export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div className="w-full px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-6">
          <h1 className="text-base font-semibold text-[#111827]">
            ダッシュボード
          </h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            IPブロック管理とアクセスログ確認を行う管理画面です。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/admin/logs"
            className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:border-[#d1d5db]"
          >
            <p className="text-sm font-semibold text-[#111827]">
              アクセスログ
            </p>
            <p className="mt-2 text-xs leading-6 text-[#6b7280]">
              アクセス履歴の確認、期間指定、CSVダウンロードを行います。
            </p>
          </a>

          <a
            href="/admin/list-ip"
            className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:border-[#d1d5db]"
          >
            <p className="text-sm font-semibold text-[#111827]">
              ブロックIP一覧
            </p>
            <p className="mt-2 text-xs leading-6 text-[#6b7280]">
              登録済みのブロックIPを確認・削除します。
            </p>
          </a>

          <a
            href="/admin/add-ip"
            className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition hover:border-[#d1d5db]"
          >
            <p className="text-sm font-semibold text-[#111827]">
              ブロックIP追加
            </p>
            <p className="mt-2 text-xs leading-6 text-[#6b7280]">
              新しく拒否するIPアドレスを登録します。
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
