import { getMessages } from '@/i18n/get-messages';

export function Stats() {
  const t = getMessages();

  return (
    <section className="border-t border-white/5 py-20">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {t.stats.items.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text font-display text-4xl font-medium text-transparent sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">{t.stats.disclaimer}</p>
      </div>
    </section>
  );
}
