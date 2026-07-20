'use client';

import { Languages } from 'lucide-react';
import { useTranslations } from '@/i18n/locale-provider';
import { cn } from '@/lib/utils';

const LABELS: Record<'en' | 'ru', string> = { en: 'EN', ru: 'RU' };

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslations();

  return (
    <div
      className={cn('flex items-center gap-1 rounded-full border border-white/10 p-0.5', className)}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
      {(['en', 'ru'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            'rounded-full px-2 py-1 text-xs font-medium transition-colors',
            locale === l
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={locale === l}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
