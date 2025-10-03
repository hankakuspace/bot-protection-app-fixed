// src/app/test-nav/page.tsx

// ✅ 静的生成を完全に無効化
export const dynamic = "force-dynamic";

import ClientTestNav from "./test-nav-client";

export default function TestNavPage() {
  return <ClientTestNav />;
}
