// src/app/page.tsx
"use client";

import {
  AppProvider as PolarisProvider,
  Page,
  Card,
  Text,
  Link,
  BlockStack,
} from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import { TitleBar } from "@shopify/app-bridge-react";
import AppBridgeProvider from "@/components/AppBridgeProvider";

export default function Home() {
  return (
    <AppBridgeProvider>
      <PolarisProvider i18n={enTranslations}>
        <Page title="Bot Protection App">
          <TitleBar title="Bot Protection App" />
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Bot Protection 管理アプリ
              </Text>
              <Text as="p">
                下記のリンクから各機能ページに移動できます。
              </Text>
              <ul style={{ marginTop: "1rem" }}>
                <li>
                  <Link url="/admin/list-ip">ブロックリスト一覧</Link>
                </li>
                <li>
                  <Link url="/admin/add-ip">IP追加</Link>
                </li>
                <li>
                  <Link url="/admin/logs">アクセスログ</Link>
                </li>
              </ul>
            </BlockStack>
          </Card>
        </Page>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}
