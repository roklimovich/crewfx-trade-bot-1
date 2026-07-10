const TESTIMONIALS = [
  {
    quote:
      'The confidence score changed how I size trades. I stopped treating every alert the same way, and that alone cleaned up my week.',
    name: 'Marta K.',
    role: 'Part-time Forex trader',
    initials: 'MK',
  },
  {
    quote:
      'What sold me was the reasoning, not the signal. When I can see why RSI and MACD agree, I actually trust the call enough to act on it.',
    name: 'Daniel O.',
    role: 'OTC trader, 3 years',
    initials: 'DO',
  },
  {
    quote:
      'Telegram delivery means I never have a tab open babysitting a chart. The signal finds me, with the risk level already attached.',
    name: 'Priya S.',
    role: 'Swing trader',
    initials: 'PS',
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="container">
        <h2 className="text-center font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Traders read the reasoning, not just the arrow
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="glass-panel flex flex-col justify-between p-6">
              <blockquote className="text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-xs font-medium text-white">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
