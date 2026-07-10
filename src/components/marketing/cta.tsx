import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Cta() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-transparent to-accent/15 px-8 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            See the next signal before you decide anything
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Free to start, no card required. Watch the reasoning arrive before you commit to a plan.
          </p>
          <Link
            href="/register"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Create your free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
