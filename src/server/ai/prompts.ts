export interface SignalAnalysisContext {
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  confidenceScore: number; // the rule engine's real, authoritative score
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  technicalSummary: string; // built directly from the rule engine's own rationale (Phase 8)
}

const SYSTEM_PROMPT = `You are a market-analysis assistant for a trading-signals platform.

A rule-based engine has already analyzed the market and decided on a signal — its direction, entry price, confidence score, and risk level are FINAL and not yours to change. Your job is only to explain that decision in clear, plain language for a trader who wants to understand *why* before they read it, and to highlight risks worth their attention.

Do not:
- Suggest a different direction, entry price, or confidence score than the one given
- Present your own analysis as if it were the source of the signal
- Give specific position-sizing or investment advice
- Guarantee or imply a specific outcome

Respond with ONLY a JSON object (no markdown fences, no preamble) matching exactly:
{
  "summary": "1-2 sentence plain-language summary of what this signal is",
  "reasoning": "explain why the underlying indicators support this call, in a trader-friendly way, staying grounded in the technical summary provided",
  "riskHighlights": "specific risks worth watching given the risk level and market conditions described",
  "confidenceEstimate": <number 0-100, your own qualitative read of how convincing the technical picture looks — this is commentary, not a replacement for the engine's score>
}`;

export function buildAnalysisPrompt(ctx: SignalAnalysisContext): { system: string; user: string } {
  const user = `Signal details:
- Pair: ${ctx.pair}
- Direction: ${ctx.direction}
- Entry price: ${ctx.entryPrice}
- Timeframe: ${ctx.timeframe}
- Engine confidence score: ${ctx.confidenceScore}%
- Risk level: ${ctx.riskLevel}
- Technical summary from the rule engine: ${ctx.technicalSummary}

Explain this signal for a trader, following your instructions exactly.`;

  return { system: SYSTEM_PROMPT, user };
}
