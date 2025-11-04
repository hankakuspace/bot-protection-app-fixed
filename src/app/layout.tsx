// src/app/layout.tsx
import '@/app/globals.css';
export const metadata = {
  title: 'Bot Protection App',
  description: 'IP block admin tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
