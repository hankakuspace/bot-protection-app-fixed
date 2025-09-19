// src/app/admin/layout.tsx
"use client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ RootLayout にナビゲーションを統合したためここでは描画不要 */}
      <main className="p-6">{children}</main>
    </div>
  );
}
