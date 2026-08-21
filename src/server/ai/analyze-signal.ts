import { prisma } from '@/server/db/prisma';
import { logEvent } from '@/server/security/audit-log';
import { LOCALES, type Locale } from '@/i18n/config';
import { getAnthropicClient, getAnthropicModel, isAiAnalysisEnabled } from './client';
import { buildAnalysisPrompt, type SignalAnalysisContext } from './prompts';
import { parseAiAnalysisResponse } from './schema';

export interface AnalyzeSignalResult {
  signalId: string;
  analyzed: boolean;
  locales: Locale[]; // which locales were actually (re)generated this call
  reason?: string;
}

/**
 * Generates and stores an AIAnalysis row for one signal, IN EVERY SUPPORTED LOCALE (Phase 13) —
 * one LLM call per locale, since a single generated-once English explanation can't honestly
 * serve a Russian-reading user. Never touches the Signal row itself — direction, entryPrice,
 * confidenceScore, and riskLevel were already finalized by the rule engine (Phase 8) before this
 * ever runs. A failure analyzing one locale doesn't block the others; a failure here at all is
 * always non-fatal to the signal, which stays fully valid and usable without an AI explanation.
 */
export async function analyzeSignal(signalId: string): Promise<AnalyzeSignalResult> {
  try {
    if (!isAiAnalysisEnabled()) {
      return {
        signalId,
        analyzed: false,
        locales: [],
        reason: 'ANTHROPIC_API_KEY not configured — AI analysis skipped.',
      };
    }

    const signal = await prisma.signal.findUnique({ where: { id: signalId } });
    if (!signal) {
      return { signalId, analyzed: false, locales: [], reason: 'Signal not found.' };
    }

    const existing = await prisma.aIAnalysis.findMany({
      where: { signalId },
      select: { locale: true },
    });
    const existingLocales = new Set(existing.map((e) => e.locale));
    const localesToGenerate = LOCALES.filter((l) => !existingLocales.has(l));

    if (localesToGenerate.length === 0) {
      return {
        signalId,
        analyzed: false,
        locales: [],
        reason: 'Already analyzed in every supported locale.',
      };
    }

    const context: SignalAnalysisContext = {
      pair: signal.pair,
      direction: signal.direction,
      entryPrice: signal.entryPrice,
      confidenceScore: signal.confidenceScore,
      riskLevel: signal.riskLevel,
      timeframe: signal.timeframe,
      technicalSummary: signal.technicalSummary,
      strategyEvidence: signal.analysisSnapshot
        ? JSON.stringify(signal.analysisSnapshot)
        : undefined,
    };

    const generated: Locale[] = [];

    // Sequential, not Promise.all — same rate-limit-friendliness reasoning as
    // src/server/market-data/ingest.ts: a burst of parallel LLM calls is more likely to trip
    // provider rate limits than a short sequential loop over just 2-3 locales.
    for (const locale of localesToGenerate) {
      const ok = await analyzeSignalForLocale(signalId, context, locale);
      if (ok) generated.push(locale);
    }

    return { signalId, analyzed: generated.length > 0, locales: generated };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI analysis error';
    await logEvent('ERROR', `AI analysis failed for signal ${signalId}`, {
      context: { error: message },
    }).catch(() => {});
    return { signalId, analyzed: false, locales: [], reason: message };
  }
}

async function analyzeSignalForLocale(
  signalId: string,
  context: SignalAnalysisContext,
  locale: Locale,
): Promise<boolean> {
  try {
    const { system, user } = buildAnalysisPrompt(context, locale);
    const client = getAnthropicClient();
    const model = getAnthropicModel();

    const response = await client.messages.create({
      model,
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Model response contained no text block.');
    }

    const parsed = parseAiAnalysisResponse(textBlock.text);
    if (!parsed) {
      await logEvent(
        'WARN',
        `AI analysis response failed validation for signal ${signalId} (${locale})`,
        {
          context: { signalId, locale, rawText: textBlock.text.slice(0, 500) },
        },
      );
      return false;
    }

    await prisma.aIAnalysis.upsert({
      where: { signalId_locale: { signalId, locale } },
      update: {
        summary: parsed.summary,
        reasoning: parsed.reasoning,
        riskHighlights: parsed.riskHighlights,
        confidenceEstimate: parsed.confidenceEstimate,
        model,
      },
      create: {
        signalId,
        locale,
        summary: parsed.summary,
        reasoning: parsed.reasoning,
        riskHighlights: parsed.riskHighlights,
        confidenceEstimate: parsed.confidenceEstimate,
        model,
      },
    });

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI analysis error';
    await logEvent('ERROR', `AI analysis failed for signal ${signalId} (${locale})`, {
      context: { error: message },
    }).catch(() => {});
    return false;
  }
}
