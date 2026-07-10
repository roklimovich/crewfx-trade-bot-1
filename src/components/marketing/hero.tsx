import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SignalCard } from './signal-card';
import { CandlestickBackdrop } from './candlestick-backdrop';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-glow-purple pb-24 pt-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="container grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Reading 40+ pairs across Forex &amp; OTC, right now
          </div>

          <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Signals that show <span className="glow-text">their work.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            SignalForge scores every pair on trend, momentum, and volatility, then only speaks up
            when multiple indicators agree. Every signal ships with the reasoning behind it — not
            just a direction and a countdown.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Start reading signals
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-3.5 font-medium text-foreground/90 transition-colors hover:bg-white/5"
            >
              See how it works
            </a>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Informational signals only. SignalForge never places trades — every decision stays
            yours.
          </p>
        </div>

        <div className="relative h-[420px]">
          <CandlestickBackdrop className="absolute inset-x-0 top-1/2 h-32 w-full -translate-y-1/2 opacity-80" />

          <SignalCard
            pair="EUR/USD"
            direction="BUY"
            confidence={87}
            price="1.0842"
            timeframe="M15"
            className="absolute left-2 top-4 [--tilt:-3deg] sm:left-8"
            style={{ animationDelay: '0s' }}
          />
          <SignalCard
            pair="XAU/USD"
            direction="SELL"
            confidence={74}
            price="2,384.10"
            timeframe="H1"
            className="absolute right-0 top-40 [--tilt:2deg] sm:right-4"
            style={{ animationDelay: '1.2s' }}
          />
          <SignalCard
            pair="GBP/JPY"
            direction="BUY"
            confidence={91}
            price="198.442"
            timeframe="M5"
            className="absolute bottom-2 left-10 [--tilt:-1.5deg] sm:left-16"
            style={{ animationDelay: '2.1s' }}
          />
        </div>
      </div>
    </section>
  );
}
