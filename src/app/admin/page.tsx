// src/app/page.tsx
"use client";

import { TitleBar } from "@shopify/app-bridge-react";
import { AppProvider as PolarisProvider, Page } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import AppBridgeProvider from "@/components/AppBridgeProvider";

export default function HomePage() {
  return (
    <AppBridgeProvider>
      <PolarisProvider i18n={enTranslations}>
        <Page title="Bot Protection App">
          <TitleBar title="Bot Protection App" />
          <p>Welcome to Bot Protection App</p>
        </Page>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}
