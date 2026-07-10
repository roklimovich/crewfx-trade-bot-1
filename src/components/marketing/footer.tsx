import Link from 'next/link';
import { CandlestickChart } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', href: '#' },
      { label: 'Privacy policy', href: '#' },
      { label: 'Risk disclosure', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-16">
      <div className="container">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-medium">
              <CandlestickChart className="h-5 w-5 text-primary" />
              SignalForge
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Rule-based, confidence-scored trading signals for Forex and OTC markets. Informational
              only — not financial advice, and never auto-traded.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-medium">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/5 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SignalForge. All rights reserved.</p>
          <p>Trading involves risk. Signals are informational and not a guarantee of outcome.</p>
        </div>
      </div>
    </footer>
  );
}
