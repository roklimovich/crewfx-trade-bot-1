import { Check } from 'lucide-react';
import { getMessages } from '@/i18n/get-messages';

export function Benefits() {
  const t = getMessages();

  return (
    <section className="border-t border-white/5 py-24">
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {t.benefits.heading1}
            <br />
            {t.benefits.heading2}
          </h2>
          <ul className="mt-8 space-y-5">
            {t.benefits.items.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                </span>
                <span className="text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
            {t.benefits.telegramLabel}
          </p>
          <div className="space-y-3">
            <div className="rounded-xl rounded-tl-sm bg-white/5 p-4">
              <p className="font-mono text-sm text-success">▲ BUY · EUR/USD · M15</p>
              <p className="mt-2 text-sm text-foreground/90">
                Confidence 87%. RSI(14) crossed above 55 with MACD histogram expanding and price
                holding above EMA(50). Risk: Medium.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Entry 1.0842 · expires in 14m</p>
            </div>
            <div className="rounded-xl rounded-tl-sm bg-white/5 p-4">
              <p className="font-mono text-sm text-danger">▼ SELL · XAU/USD · H1</p>
              <p className="mt-2 text-sm text-foreground/90">
                Confidence 74%. Rejected at resistance with ADX confirming trend strength. Risk:
                High — volatility elevated.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Entry 2,384.10 · expires in 52m</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
