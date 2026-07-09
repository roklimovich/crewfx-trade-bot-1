import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'SignalForge — AI-Assisted Forex & OTC Trading Signals',
  description:
    'Informational technical-analysis signals for Forex and OTC markets. Not financial advice.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans">{children}</body>
    </html>
  );
}
