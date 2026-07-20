import { GitCompareArrows, ShieldAlert, BrainCircuit, Radar, History, Send } from 'lucide-react';
import { getMessages } from '@/i18n/get-messages';

const ICONS = [GitCompareArrows, Radar, ShieldAlert, BrainCircuit, Send, History];

export function Features() {
  const t = getMessages();

  return (
    <section id="features" className="border-t border-white/5 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {t.features.heading}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.features.subheading}</p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((feature, i) => {
            const Icon = ICONS[i] ?? GitCompareArrows;
            return (
              <div
                key={feature.title}
                className="bg-background p-8 transition-colors hover:bg-white/[0.03]"
              >
                <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <h3 className="mt-5 font-display text-lg font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
