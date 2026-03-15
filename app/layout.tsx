import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-sans-jp',
});

export const metadata: Metadata = {
  title: '大人げない評価システム',
  description: '仲間内の大人げなさを評価するネタアプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${notoSansJP.className}`}>
        {children}
      </body>
    </html>
  );
}
