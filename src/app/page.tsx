// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { Suspense } from "react";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import type { ClientApplication } from "@shopify/app-bridge";

function PageInner() {
  // ✅ unknown を挟んでから ClientApplication にキャスト
  const app = useAppBridge() as unknown as ClientApplication<any>;

  useEffect(() => {
    if (app) {
      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, "/admin/logs");
    }
  }, [app]);

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageInner />
    </Suspense>
  );
}
