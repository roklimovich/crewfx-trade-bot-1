import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMessages } from '@/i18n/get-messages';

export function Pricing() {
  const t = getMessages();
  const highlightedIndex = 1; // "Pro" tier — kept as a fixed structural index alongside the translated array

  return (
    <section id="pricing" className="border-t border-white/5 py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {t.pricing.heading}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.pricing.subheading}</p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {t.pricing.tiers.map((tier, i) => {
            const highlighted = i === highlightedIndex;
            return (
              <div
                key={tier.name}
                className={cn(
                  'flex flex-col rounded-2xl border p-8',
                  highlighted
                    ? 'border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_60px_-15px_rgba(59,130,246,0.45)]'
                    : 'border-white/10 bg-white/[0.02]',
                )}
              >
                {highlighted && (
                  <span className="mb-4 w-fit rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                    {t.pricing.mostPopular}
                  </span>
                )}
                <h3 className="font-display text-xl font-medium">{tier.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-medium">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">/ {tier.period}</span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={cn(
                    'mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90',
                    highlighted
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-white/15 text-foreground',
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t.pricing.note}{' '}
          <code className="rounded bg-white/10 px-1 py-0.5">src/i18n/locales/en.ts</code>
        </p>
      </div>
    </section>
  );
}
