import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getPlatformSettings } from '@/lib/platform';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'MarkazOS — Complete Retail & Store Management Platform',
  description:
    'Multi-tenant retail & store management SaaS. Inventory, POS, Udhaar/Khata, customers, payments, invoices, reports and marketing — all in one place.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'MarkazOS — Run Your Entire Store From One Powerful System',
    description: 'Run your entire store from one powerful system.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Platform theme is chosen by the super admin and applied globally.
  const { themeKey } = await getPlatformSettings();
  return (
    <html lang="en" data-theme={themeKey} className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
