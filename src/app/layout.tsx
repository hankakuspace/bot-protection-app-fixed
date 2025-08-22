import './globals.css';

export const metadata = {
  title: 'Tailwind Check',
  description: 'Test if Tailwind CSS is working',
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
