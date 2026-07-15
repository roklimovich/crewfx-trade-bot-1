import { prisma } from '@/server/db/prisma';
import { logEvent } from '@/server/security/audit-log';
import { getAnthropicClient, getAnthropicModel, isAiAnalysisEnabled } from './client';
import { buildAnalysisPrompt, type SignalAnalysisContext } from './prompts';
import { parseAiAnalysisResponse } from './schema';

export interface AnalyzeSignalResult {
  signalId: string;
  analyzed: boolean;
  reason?: string;
}

/**
 * Generates and stores an AIAnalysis row for one signal. Never touches the Signal row itself —
 * direction, entryPrice, confidenceScore, and riskLevel were already finalized by the rule
 * engine (Phase 8) before this ever runs. A failure here (missing API key, network error, a DB
 * hiccup, malformed model output) is always non-fatal to the signal, which stays fully valid and
 * usable without an AI explanation attached. The entire body is one try/catch specifically so
 * that guarantee holds even for the lookups before the LLM call, not just the call itself.
 */
export async function analyzeSignal(signalId: string): Promise<AnalyzeSignalResult> {
  try {
    if (!isAiAnalysisEnabled()) {
      return {
        signalId,
        analyzed: false,
        reason: 'ANTHROPIC_API_KEY not configured — AI analysis skipped.',
      };
    }

    const existing = await prisma.aIAnalysis.findUnique({ where: { signalId } });
    if (existing) {
      return { signalId, analyzed: false, reason: 'Already analyzed.' };
    }

    const signal = await prisma.signal.findUnique({ where: { id: signalId } });
    if (!signal) {
      return { signalId, analyzed: false, reason: 'Signal not found.' };
    }

    const context: SignalAnalysisContext = {
      pair: signal.pair,
      direction: signal.direction,
      entryPrice: signal.entryPrice,
      confidenceScore: signal.confidenceScore,
      riskLevel: signal.riskLevel,
      timeframe: signal.timeframe,
      technicalSummary: signal.technicalSummary,
    };

    const { system, user } = buildAnalysisPrompt(context);
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
      await logEvent('WARN', `AI analysis response failed validation for signal ${signalId}`, {
        context: { signalId, rawText: textBlock.text.slice(0, 500) },
      });
      return { signalId, analyzed: false, reason: 'Model response failed validation.' };
    }

    await prisma.aIAnalysis.create({
      data: {
        signalId,
        summary: parsed.summary,
        reasoning: parsed.reasoning,
        riskHighlights: parsed.riskHighlights,
        confidenceEstimate: parsed.confidenceEstimate,
        model,
      },
    });

    return { signalId, analyzed: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI analysis error';
    await logEvent('ERROR', `AI analysis failed for signal ${signalId}`, {
      context: { error: message },
    }).catch(() => {});
    return { signalId, analyzed: false, reason: message };
  }
}
