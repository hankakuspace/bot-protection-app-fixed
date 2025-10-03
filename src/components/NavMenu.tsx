// src/components/NavMenu.tsx
"use client";

import { useEffect } from "react";
import { useAppBridgeCustom } from "@/lib/AppBridgeProvider";

export default function NavMenu() {
  const app = useAppBridgeCustom();

  useEffect(() => {
    if (!app) return;

    const urlParams = new URLSearchParams(window.location.search);
    const host = urlParams.get("host") || "";

    // ✅ Web Components API を直接使う
    const navMenuEl = document.createElement("ui-nav-menu");
    navMenuEl.setAttribute("items", JSON.stringify([
      { label: "ダッシュボード", destination: `/dashboard?host=${host}` },
      { label: "アクセスログ", destination: `/logs?host=${host}` },
      { label: "管理者設定", destination: `/admin-ip?host=${host}` },
      { label: "ブロック設定", destination: `/block-ip?host=${host}` },
    ]));

    document.body.appendChild(navMenuEl);

    return () => {
      navMenuEl.remove();
    };
  }, [app]);

  return null;
}
