// src/app/blocked/page.tsx
export default function BlockedPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-red-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">アクセス拒否</h1>
        <p className="mt-4 text-gray-700">
          お使いのIPアドレスからはアクセスできません。
        </p>
      </div>
    </div>
  );
}
