import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { getPlatformSettings } from '@/lib/platform';

// Display face: a warm, slightly idiosyncratic serif. Used only for headings
// and the wordmark, so it reads as a brand voice rather than as decoration.
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Reading face: a grotesque with real character at small sizes — the whole
// product is tables and figures, so it has to hold up at 13px.
const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MarkazOS — Retail & store management for shopkeepers',
  description:
    'Multi-tenant retail & store management SaaS. Inventory, POS, Udhaar/Khata, customers, payments, invoices, reports and marketing — all in one place.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'MarkazOS — Run your whole shop from one counter',
    description: 'Inventory, POS, khata and reports for independent retailers.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Platform theme is chosen by the super admin and applied globally.
  const { themeKey } = await getPlatformSettings();
  return (
    <html lang="en" data-theme={themeKey} className={`${display.variable} ${body.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
