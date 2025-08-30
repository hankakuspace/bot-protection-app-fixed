// src/app/page.tsx
"use client";

import { Page, TitleBar } from "@shopify/app-bridge-react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import AppBridgeProvider from "@/components/AppBridgeProvider";

export default function HomePage() {
  return (
    <AppBridgeProvider>
      <PolarisProvider i18n={enTranslations}>
        <Page title="Bot Protection App">
          <TitleBar title="Bot Protection App" />
        </Page>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}
