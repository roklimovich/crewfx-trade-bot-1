import { buildAnalysisPrompt, type SignalAnalysisContext } from '../prompts';

const context: SignalAnalysisContext = {
  pair: 'EUR/USD',
  direction: 'BUY',
  entryPrice: 1.0842,
  confidenceScore: 87,
  riskLevel: 'MEDIUM',
  timeframe: 'M15',
  technicalSummary: 'RSI crossed above 55. MACD histogram is positive.',
};

describe('buildAnalysisPrompt', () => {
  it("instructs the model not to override the engine's decision", () => {
    const { system } = buildAnalysisPrompt(context);
    expect(system.toLowerCase()).toContain('final');
    expect(system.toLowerCase()).toContain('not yours to change');
  });

  it('requests a strict JSON response shape', () => {
    const { system } = buildAnalysisPrompt(context);
    expect(system).toContain('"summary"');
    expect(system).toContain('"reasoning"');
    expect(system).toContain('"riskHighlights"');
    expect(system).toContain('"confidenceEstimate"');
  });

  it('embeds the exact signal values the engine decided, not placeholders', () => {
    const { user } = buildAnalysisPrompt(context);
    expect(user).toContain('EUR/USD');
    expect(user).toContain('BUY');
    expect(user).toContain('1.0842');
    expect(user).toContain('87%');
    expect(user).toContain('MEDIUM');
    expect(user).toContain('RSI crossed above 55');
  });

  it('forbids investment advice and outcome guarantees in the system prompt', () => {
    const { system } = buildAnalysisPrompt(context);
    expect(system.toLowerCase()).toContain('position-sizing');
    expect(system.toLowerCase()).toContain('guarantee');
  });

  it('defaults to instructing the model to respond in English', () => {
    const { system } = buildAnalysisPrompt(context);
    expect(system).toContain('Write your response entirely in English');
  });

  it('instructs the model to respond in Russian when locale is "ru"', () => {
    const { system, user } = buildAnalysisPrompt(context, 'ru');
    expect(system).toContain('Write your response entirely in Russian');
    expect(user).toContain('respond in Russian');
    // JSON keys must still be in English even when the values are Russian
    expect(system).toContain('"summary"');
    expect(system).toContain('"reasoning"');
  });

  it('never asks for two different languages at once', () => {
    const { system: enSystem } = buildAnalysisPrompt(context, 'en');
    const { system: ruSystem } = buildAnalysisPrompt(context, 'ru');
    expect(enSystem).not.toContain('Russian');
    expect(ruSystem).not.toContain('Write your response entirely in English');
  });
});
