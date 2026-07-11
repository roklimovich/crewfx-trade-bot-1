import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'accent';
}

export function StatCard({ label, value, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon
          className={cn(
            'h-4 w-4',
            tone === 'success' && 'text-success',
            tone === 'accent' && 'text-accent',
            tone === 'default' && 'text-primary',
          )}
          strokeWidth={1.75}
        />
      </div>
      <p className="mt-3 font-display text-2xl font-medium">{value}</p>
    </div>
  );
}
