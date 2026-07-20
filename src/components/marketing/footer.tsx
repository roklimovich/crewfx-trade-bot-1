import Link from 'next/link';
import { CandlestickChart } from 'lucide-react';
import { getMessages } from '@/i18n/get-messages';

export function Footer() {
  const t = getMessages();

  const columns = [
    {
      title: t.footer.product,
      links: [
        { label: t.nav.features, href: '#features' },
        { label: t.nav.pricing, href: '#pricing' },
        { label: t.nav.faq, href: '#faq' },
        { label: t.footer.apiDocs, href: '/api-docs' },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.footer.about, href: '#' },
        { label: t.footer.contact, href: '#' },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.footer.terms, href: '#' },
        { label: t.footer.privacy, href: '#' },
        { label: t.footer.riskDisclosure, href: '#' },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/5 py-16">
      <div className="container">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-medium">
              <CandlestickChart className="h-5 w-5 text-primary" />
              SignalForge
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t.footer.description}</p>
          </div>

          {columns.map((col) => (
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
          <p>
            © {new Date().getFullYear()} SignalForge. {t.footer.rights}
          </p>
          <p>{t.footer.riskWarning}</p>
        </div>
      </div>
    </footer>
  );
}
