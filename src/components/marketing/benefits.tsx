import { Check } from 'lucide-react';

const BENEFITS = [
  'Stop scanning six timeframes by hand — the engine already cross-checked them before you saw the alert.',
  'Confidence scores mean you can size positions by conviction instead of gut feel.',
  'Every signal links back to the exact indicator values that produced it, so you can audit any call later.',
  'Pending accounts stay invisible to the signal feed until an admin approves them — no unvetted access.',
];

export function Benefits() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Less time watching charts.
            <br />
            More time deciding.
          </h2>
          <ul className="mt-8 space-y-5">
            {BENEFITS.map((benefit) => (
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
            Telegram · SignalForge Bot
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
