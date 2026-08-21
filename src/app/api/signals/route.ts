import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import {
  parseSignalHistoryFilters,
  buildSignalHistoryWhere,
} from '@/server/analytics/signal-query';
import { isLocale, DEFAULT_LOCALE, LOCALE_COOKIE } from '@/i18n/config';

/**
 * GET /api/signals?pair=EUR/USD&direction=BUY&status=WON&dateFrom=2026-07-01&dateTo=2026-07-12
 *                  &search=RSI&page=1&pageSize=25
 *
 * Superset of Phase 8's original filters (pair/status still work as before) — pageSize/page
 * replace the old single `limit` param now that Phase 11 needs real pagination for the signal
 * history table, not just "give me the latest N".
 *
 * Phase 13: each signal now carries `aiAnalysis` resolved to the requester's own site language
 * (read from the NEXT_LOCALE cookie — the same one src/i18n/locale-provider.tsx sets), falling
 * back to English if that locale doesn't have a generated analysis for some reason. The full,
 * unresolved `aiAnalyses` array (every generated locale) is also included for any consumer that
 * wants it directly.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Your account is not yet active.' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const filters = parseSignalHistoryFilters(searchParams);
  const where = buildSignalHistoryWhere(filters);

  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get('pageSize') ?? searchParams.get('limit') ?? 25)),
  );

  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  const requestLocale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where,
      include: {
        history: true,
        aiAnalyses: true,
        // Feedback is private to its author: a user must not see another trader's loss report.
        feedback: { where: { userId: user.sub }, select: { verdict: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.signal.count({ where }),
  ]);

  const resolved = signals.map((s) => {
    const { aiAnalyses, feedback, ...rest } = s;
    const aiAnalysis =
      aiAnalyses.find((a) => a.locale === requestLocale) ??
      aiAnalyses.find((a) => a.locale === DEFAULT_LOCALE) ??
      null;
    return {
      ...rest,
      aiAnalysis,
      aiAnalyses,
      reportedLoss: feedback.some((item) => item.verdict === 'LOST'),
    };
  });

  return NextResponse.json({ signals: resolved, total, page, pageSize });
}
