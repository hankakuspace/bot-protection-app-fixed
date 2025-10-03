// src/app/loading-demo/page.tsx
"use client";

export default function LoadingDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <svg
        className="animate-spin h-8 w-8 text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 1 0-8 8v2a10 10 0 1 1 0-20z"
        />
      </svg>
    </div>
  );
}
