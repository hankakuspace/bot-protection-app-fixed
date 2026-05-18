// src/app/page.tsx
"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const search = window.location.search || "";
    window.location.replace(`/admin${search}`);
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div className="w-full px-4 py-6 sm:px-6 xl:px-8">
        <p className="text-sm text-[#6b7280]">ダッシュボードへ移動中です...</p>
      </div>
    </main>
  );
}
