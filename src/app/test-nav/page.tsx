// src/app/test-nav/page.tsx
// ✅ サーバーコンポーネント (client 指定しない)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { AppBridgeProvider } from "@/lib/AppBridgeProvider";
import ClientTestNav from "./test-nav-client";

export default function TestNavPage() {
  return (
    <AppBridgeProvider>
      <ClientTestNav />
    </AppBridgeProvider>
  );
}
