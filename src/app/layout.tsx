import "./globals.css";
import AppBridgeProvider from "@/components/AppBridgeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
  <meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!} />
  <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
</head>

      <body>
        <AppBridgeProvider>
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
