import type { Metadata } from 'next';
import Link from 'next/link';
import { CandlestickChart } from 'lucide-react';
import { ApiDocsLazy } from '@/components/api-docs-lazy';
import '@/styles/swagger-dark.css';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Interactive REST API reference for CrewFX.',
};

export default function ApiDocsPage() {
  return (
    <div className="swagger-ui-dark-wrapper">
      <div className="container mb-6 flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-medium text-foreground"
        >
          <CandlestickChart className="h-5 w-5 text-primary" />
          CrewFX API
        </Link>
      </div>
      <ApiDocsLazy />
    </div>
  );
}
