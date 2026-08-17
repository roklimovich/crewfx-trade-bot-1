import Link from 'next/link';
import { CandlestickChart } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-glow-blue px-6 py-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-lg font-medium"
        >
          <CandlestickChart className="h-5 w-5 text-primary" />
          CrewFX
        </Link>
        <div className="glass-panel p-8">{children}</div>
      </div>
    </div>
  );
}
