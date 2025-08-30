// src/app/admin/page.tsx
"use client";

import { TitleBar } from "@shopify/app-bridge-react";
import { AppProvider as PolarisProvider, Page } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import AppBridgeProvider from "@/components/AppBridgeProvider";
import ShopifyNavigation from "@/components/ShopifyNavigation";

export default function AdminHome() {
  return (
    <AppBridgeProvider>
      <PolarisProvider i18n={enTranslations}>
        <Page title="Bot Protection App (Admin)">
          <TitleBar title="Bot Protection App (Admin)" />
          <ShopifyNavigation /> {/* ← ナビゲーション初期化 */}
          <p>ここに管理画面用のUIを追加してください。</p>
        </Page>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}
