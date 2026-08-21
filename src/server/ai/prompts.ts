import type { Locale } from '@/i18n/config';

export interface SignalAnalysisContext {
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  confidenceScore: number; // the rule engine's real, authoritative score
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  technicalSummary: string; // built directly from the rule engine's own rationale (Phase 8)
  strategyEvidence?: string;
}

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  ru: 'Russian',
};

function buildSystemPrompt(locale: Locale): string {
  return `You are a market-analysis assistant for a trading-signals platform.

A rule-based engine has already analyzed the market and decided on a signal — its direction, entry price, confidence score, and risk level are FINAL and not yours to change. Your job is only to explain that decision in clear, plain language for a trader who wants to understand *why* before they read it, and to highlight risks worth their attention.

Do not:
- Suggest a different direction, entry price, or confidence score than the one given
- Present your own analysis as if it were the source of the signal
- Give specific position-sizing or investment advice
- Guarantee or imply a specific outcome

Write your response entirely in ${LANGUAGE_NAMES[locale]}. This is important — the person reading it has selected ${LANGUAGE_NAMES[locale]} as their site language, and English (or any other language) text would be unreadable to them. Only the JSON keys themselves stay in English (as shown below); every string VALUE must be in ${LANGUAGE_NAMES[locale]}.

Respond with ONLY a JSON object (no markdown fences, no preamble) matching exactly:
{
  "summary": "1-2 sentence plain-language summary of what this signal is, in ${LANGUAGE_NAMES[locale]}",
  "reasoning": "explain why the underlying indicators support this call, in a trader-friendly way, staying grounded in the technical summary provided, in ${LANGUAGE_NAMES[locale]}",
  "riskHighlights": "specific risks worth watching given the risk level and market conditions described, in ${LANGUAGE_NAMES[locale]}",
  "confidenceEstimate": <number 0-100, your own qualitative read of how convincing the technical picture looks — this is commentary, not a replacement for the engine's score>
}`;
}

export function buildAnalysisPrompt(
  ctx: SignalAnalysisContext,
  locale: Locale = 'en',
): { system: string; user: string } {
  const user = `Signal details:
- Pair: ${ctx.pair}
- Direction: ${ctx.direction}
- Entry price: ${ctx.entryPrice}
- Timeframe: ${ctx.timeframe}
- Engine confidence score: ${ctx.confidenceScore}%
- Risk level: ${ctx.riskLevel}
- Technical summary from the rule engine: ${ctx.technicalSummary}
${ctx.strategyEvidence ? `- Strategy zones used by the engine: ${ctx.strategyEvidence}` : ''}

Explain this signal for a trader, following your instructions exactly. Remember: respond in ${LANGUAGE_NAMES[locale]}.`;

  return { system: buildSystemPrompt(locale), user };
}
