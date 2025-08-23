// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AppProvider as PolarisProvider,
  Page,
  Card,
  Text,
  Link,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Provider, TitleBar } from "@shopify/app-bridge-react";

export default function Home() {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    const h = new URLSearchParams(window.location.search).get("host");
    if (h) {
      setHost(h);
    } else {
      console.error("❌ Shopify host param is missing");
    }
  }, []);

  if (!host) {
    return <div>Loading...</div>;
  }

  return (
    <Provider
      config={{
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host: host,
        forceRedirect: true,
      }}
    >
      <PolarisProvider>
        <Page title="Bot Protection App">
          <TitleBar title="Bot Protection App" />
          <Card sectioned>
            <Text as="h2" variant="headingMd">
              IP管理ツール
            </Text>
            <Text>このアプリからIPブロックの管理が行えます。</Text>
            <ul style={{ marginTop: "1rem" }}>
              <li>
                <Link url="/admin/list-ip" external>
                  ブロックリスト一覧
                </Link>
              </li>
              <li>
                <Link url="/admin/add-ip" external>
                  IP追加
                </Link>
              </li>
              <li>
                <Link url="/admin/logs" external>
                  アクセスログ
                </Link>
              </li>
            </ul>
          </Card>
        </Page>
      </PolarisProvider>
    </Provider>
  );
}
