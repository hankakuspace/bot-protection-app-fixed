// src/app/loading-demo/page.tsx
"use client";

export default function LoadingDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-10">
      <h1 className="text-xl font-bold">ローディングアニメーション デモ</h1>

      {/* ① スピナー */}
      <div className="flex items-center gap-3 text-gray-600">
        <svg
          className="animate-spin h-6 w-6 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span>読み込み中...</span>
      </div>

      {/* ② ドットが跳ねる */}
      <div className="flex items-center gap-1 text-gray-600 text-lg">
        <span>読み込み中</span>
        <span className="animate-bounce">.</span>
        <span className="animate-bounce delay-150">.</span>
        <span className="animate-bounce delay-300">.</span>
      </div>

      {/* ③ プログレスバー */}
      <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-blue-500 h-2 w-1/3 animate-pulse"></div>
      </div>

      {/* ④ パルスする円 */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-500 rounded-full animate-ping"></div>
        <span className="text-gray-600">読み込み中...</span>
      </div>

      {/* ⑤ 3つの丸が交互に拡大縮小 */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce delay-150"></div>
        <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce delay-300"></div>
      </div>
    </div>
  );
}
