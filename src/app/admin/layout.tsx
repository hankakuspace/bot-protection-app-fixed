// src/app/admin/layout.tsx
"use client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 共通ヘッダー */}
      <header className="p-4 border-b bg-white shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600">Bot Guard MAN</h1>
      </header>

      {/* 各ページ内容 */}
      <main className="p-6">{children}</main>
    </div>
  );
}
