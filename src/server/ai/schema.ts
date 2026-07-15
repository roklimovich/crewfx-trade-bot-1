import { z } from 'zod';

/**
 * What we ask the model to return. `confidenceEstimate` is the AI's own qualitative read —
 * explicitly NOT the number that decided whether this signal got published (that already
 * happened in Phase 8's scoring.ts, before the AI ever sees this signal). Storing it separately
 * on AIAnalysis.confidenceEstimate keeps that distinction visible in the data model, not just
 * in a comment.
 */
export const aiAnalysisResponseSchema = z.object({
  summary: z.string().min(10).max(400),
  reasoning: z.string().min(10).max(800),
  riskHighlights: z.string().min(10).max(500),
  confidenceEstimate: z.number().min(0).max(100),
});

export type AiAnalysisResponse = z.infer<typeof aiAnalysisResponseSchema>;

/**
 * Parses and validates the model's raw text output. Returns null on any failure (malformed
 * JSON, missing fields, out-of-range values) — callers treat null as "skip storing an
 * AIAnalysis row for this signal", never as a reason to block or alter the signal itself.
 */
export function parseAiAnalysisResponse(rawText: string): AiAnalysisResponse | null {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    return null;
  }

  const result = aiAnalysisResponseSchema.safeParse(parsedJson);
  return result.success ? result.data : null;
}
