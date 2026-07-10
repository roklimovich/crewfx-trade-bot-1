import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIERS = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Get a feel for how the engine reasons before you commit to anything.',
    features: ['3 signals/day', 'M15 & H1 timeframes', 'Email delivery', 'Signal history (7 days)'],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$39',
    period: 'per month',
    description: 'For traders acting on signals daily, across more pairs and timeframes.',
    features: [
      'Unlimited signals',
      'All timeframes, M1–D1',
      'Telegram + email + push',
      'AI reasoning on every signal',
      'Full signal history & analytics',
    ],
    cta: 'Start 7-day trial',
    highlighted: true,
  },
  {
    name: 'Elite',
    price: '$99',
    period: 'per month',
    description: 'Priority delivery and deeper analytics for higher-frequency trading.',
    features: [
      'Everything in Pro',
      'Priority signal delivery',
      'Exportable performance reports',
      'Direct support channel',
    ],
    cta: 'Talk to us',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-white/5 py-24">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Pricing that scales with conviction
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade once the signals earn your trust.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'flex flex-col rounded-2xl border p-8',
                tier.highlighted
                  ? 'border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_60px_-15px_rgba(139,107,255,0.4)]'
                  : 'border-white/10 bg-white/[0.02]',
              )}
            >
              {tier.highlighted && (
                <span className="mb-4 w-fit rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                  Most popular
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
                  tier.highlighted
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-white/15 text-foreground',
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Placeholder pricing — swap in real figures in{' '}
          <code className="rounded bg-white/10 px-1 py-0.5">
            src/components/marketing/pricing.tsx
          </code>
          .
        </p>
      </div>
    </section>
  );
}
