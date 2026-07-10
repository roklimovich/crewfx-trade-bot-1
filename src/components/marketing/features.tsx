import { GitCompareArrows, ShieldAlert, BrainCircuit, Radar, History, Send } from 'lucide-react';

const FEATURES = [
  {
    icon: GitCompareArrows,
    title: 'Multi-indicator confirmation',
    description:
      'RSI, MACD, EMA, ADX, and Bollinger Bands all have to agree before a signal ships. One indicator alone never triggers anything.',
  },
  {
    icon: Radar,
    title: 'Reads structure, not noise',
    description:
      'The engine holds back during ranging, low-volume, or low-confidence conditions instead of forcing a call on a coin flip.',
  },
  {
    icon: ShieldAlert,
    title: 'Risk labeled up front',
    description:
      'Every signal carries a Low / Medium / High risk tag next to its confidence score — sized for how the market is actually behaving.',
  },
  {
    icon: BrainCircuit,
    title: 'Plain-language reasoning',
    description:
      'An AI layer explains why the rules fired in a sentence you can actually use, without ever overriding what the rules decided.',
  },
  {
    icon: Send,
    title: 'Delivered where you already are',
    description:
      'Telegram, email, or push — signals reach you the moment they generate, not on a refresh cycle.',
  },
  {
    icon: History,
    title: 'Every call, tracked',
    description:
      'Win rate, by pair and by timeframe, calculated from real closed outcomes — not the signals that would have worked.',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-white/5 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Built to say less, and mean it
          </h2>
          <p className="mt-4 text-muted-foreground">
            Most signal feeds optimize for volume. SignalForge optimizes for the moments actually
            worth acting on.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-background p-8 transition-colors hover:bg-white/[0.03]"
            >
              <feature.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-lg font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
