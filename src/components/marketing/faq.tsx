'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'Is this financial advice?',
    a: 'No. SignalForge surfaces technical-analysis signals for informational purposes only. It never places trades on your behalf, and every entry, exit, and position size is a decision you make yourself.',
  },
  {
    q: 'How is the confidence score calculated?',
    a: "The engine weighs how many indicators agree, current volatility, and trend strength. Scores below your account's minimum threshold are never published — you only see signals that cleared the bar.",
  },
  {
    q: 'What is the Pocket Option ID for?',
    a: "Submitting your Pocket Option account ID lets an admin verify your account before signals unlock. It's a verification step, never a way for us to access or trade on your broker account — we only ever ask for the ID, never credentials.",
  },
  {
    q: 'Which markets does SignalForge cover?',
    a: 'Major, minor, and exotic Forex pairs plus commonly traded OTC instruments, across seven timeframes from M1 to D1.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — Pro and Elite are month-to-month with no lock-in. Downgrading to Starter keeps your account and signal history intact.',
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/5 py-24">
      <div className="container max-w-3xl">
        <h2 className="text-center font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Questions worth answering directly
        </h2>

        <div className="mt-12 divide-y divide-white/10 rounded-2xl border border-white/10">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
