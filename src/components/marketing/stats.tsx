const STATS = [
  { value: '40+', label: 'Forex & OTC pairs monitored' },
  { value: '6', label: 'Indicators cross-checked per signal' },
  { value: '7', label: 'Timeframes, from M1 to D1' },
  { value: '24/5', label: 'Market coverage, no gaps' },
];

export function Stats() {
  return (
    <section className="border-t border-white/5 py-20">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text font-display text-4xl font-medium text-transparent sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Platform coverage, not performance guarantees. Past signal accuracy for any pair is
          visible on your dashboard once you're signed in — see it before you trust it.
        </p>
      </div>
    </section>
  );
}
