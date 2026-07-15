import Anthropic from '@anthropic-ai/sdk';

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set.');

  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
}

/** True when the AI layer is configured at all — callers use this to skip gracefully, not throw. */
export function isAiAnalysisEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
