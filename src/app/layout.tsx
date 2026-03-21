import type { Metadata } from 'next';
import { Tomorrow, Inter } from 'next/font/google';
import './globals.css';

const tomorrow = Tomorrow({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-tomorrow',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'Marketing analytics powered by A Squared',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${tomorrow.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}