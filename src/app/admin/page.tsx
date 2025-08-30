// src/app/admin/page.tsx
"use client";

import { TitleBar } from "@shopify/app-bridge-react";
import { AppProvider as PolarisProvider, Page } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import AppBridgeProvider from "@/components/AppBridgeProvider";

export default function AdminHome() {
  return (
    <AppBridgeProvider>
      <PolarisProvider i18n={enTranslations}>
        <Page title="Bot Protection App">
          <TitleBar title="Bot Protection App" />
          <p>ここに管理画面の内容を追加してください</p>
        </Page>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}
