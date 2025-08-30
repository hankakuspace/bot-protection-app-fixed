import "./globals.css";
import AppBridgeProvider from "@/components/AppBridgeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppBridgeProvider>
          {children}
        </AppBridgeProvider>
      </body>
    </html>
  );
}
