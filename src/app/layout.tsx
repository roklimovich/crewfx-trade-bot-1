import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { LocaleProvider } from '@/i18n/locale-provider';
import { getServerLocale } from '@/i18n/get-messages';
import '@/styles/globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
});
const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://crewfx.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CrewFX — Technical-Analysis Signals for Forex & OTC',
    template: '%s · CrewFX',
  },
  description:
    'CrewFX reads market structure across Forex and OTC pairs and surfaces rule-based, confidence-scored trade signals with plain-language reasoning. Informational only — you make every trading decision.',
  keywords: [
    'forex signals',
    'otc trading signals',
    'technical analysis',
    'trading dashboard',
    'signal engine',
  ],
  openGraph: {
    title: 'CrewFX — Technical-Analysis Signals for Forex & OTC',
    description:
      'Rule-based, confidence-scored trade signals with plain-language reasoning. Informational only.',
    url: siteUrl,
    siteName: 'CrewFX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrewFX — Technical-Analysis Signals for Forex & OTC',
    description: 'Rule-based, confidence-scored trade signals with plain-language reasoning.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale();

  return (
    <html lang={locale} className={`dark ${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
