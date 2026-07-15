'use client';

import dynamic from 'next/dynamic';

// swagger-ui-react is a large, browser-only bundle (reads window/document) — dynamically
// imported so it never ships in any other page's JS, and never attempts to server-render.
// This file exists specifically so `ssr: false` has a Client Component boundary to live in —
// Next.js's App Router rejects `dynamic(..., { ssr: false })` called directly from a Server
// Component file (the page itself stays a server component; this one small file is the client boundary).
const ApiDocsViewer = dynamic(() => import('./api-docs-viewer').then((m) => m.ApiDocsViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
      Loading API reference…
    </div>
  ),
});

export function ApiDocsLazy() {
  return <ApiDocsViewer />;
}
