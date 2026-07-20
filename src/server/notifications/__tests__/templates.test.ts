import {
  buildNotificationContent,
  buildTelegramMessage,
  buildSignalEmail,
  buildPushPayload,
  resolveAiSummary,
  type SignalNotificationInput,
} from '../templates';

const buySignal: SignalNotificationInput = {
  pair: 'EUR/USD',
  direction: 'BUY',
  entryPrice: 1.0842,
  confidenceScore: 87,
  riskLevel: 'MEDIUM',
  timeframe: 'M15',
  technicalSummary: 'RSI crossed above 55. MACD histogram is positive.',
};

const sellSignal: SignalNotificationInput = { ...buySignal, direction: 'SELL', pair: 'GBP/JPY' };

describe('buildNotificationContent', () => {
  it('uses an up arrow for BUY and includes the pair/timeframe', () => {
    const { title } = buildNotificationContent(buySignal);
    expect(title).toContain('▲');
    expect(title).toContain('BUY');
    expect(title).toContain('EUR/USD');
    expect(title).toContain('M15');
  });

  it('uses a down arrow for SELL', () => {
    const { title } = buildNotificationContent(sellSignal);
    expect(title).toContain('▼');
    expect(title).toContain('SELL');
  });

  it('prefers the AI summary over the raw technical summary when available', () => {
    const { body } = buildNotificationContent({ ...buySignal, aiSummary: 'AI-written summary.' });
    expect(body).toBe('AI-written summary.');
  });

  it('falls back to the technical summary when no AI summary exists', () => {
    const { body } = buildNotificationContent(buySignal);
    expect(body).toBe(buySignal.technicalSummary);
  });
});

describe('buildTelegramMessage', () => {
  it('includes confidence, risk, and entry price', () => {
    const message = buildTelegramMessage(buySignal);
    expect(message).toContain('87%');
    expect(message).toContain('MEDIUM');
    expect(message).toContain('1.0842');
  });

  it('uses HTML bold tags Telegram supports, not markdown', () => {
    const message = buildTelegramMessage(buySignal);
    expect(message).toContain('<b>');
    expect(message).not.toContain('**');
  });
});

describe('buildSignalEmail', () => {
  it('includes the direction and pair in the subject', () => {
    const { subject } = buildSignalEmail(buySignal);
    expect(subject).toContain('BUY');
    expect(subject).toContain('EUR/USD');
  });

  it('includes the risk-disclosure line required across the platform', () => {
    const { html } = buildSignalEmail(buySignal);
    expect(html.toLowerCase()).toContain('not financial advice');
  });

  it('uses a different risk color for HIGH vs LOW risk', () => {
    const high = buildSignalEmail({ ...buySignal, riskLevel: 'HIGH' });
    const low = buildSignalEmail({ ...buySignal, riskLevel: 'LOW' });
    expect(high.html).not.toEqual(low.html);
  });
});

describe('buildPushPayload', () => {
  it('truncates the body to keep the push payload small', () => {
    const longSummary = 'x'.repeat(500);
    const payload = buildPushPayload({ ...buySignal, technicalSummary: longSummary });
    expect(payload.body.length).toBeLessThanOrEqual(150);
  });

  it('links to the signals page', () => {
    const payload = buildPushPayload(buySignal);
    expect(payload.url).toBe('/dashboard/signals');
  });
});

describe('resolveAiSummary', () => {
  it("returns the recipient's own locale when it exists", () => {
    const map = new Map([
      ['en', 'English summary'],
      ['ru', 'Русское резюме'],
    ]);
    expect(resolveAiSummary(map, 'ru')).toBe('Русское резюме');
  });

  it('falls back to English when the recipient locale has no generated analysis', () => {
    const map = new Map([['en', 'English summary']]);
    expect(resolveAiSummary(map, 'ru')).toBe('English summary');
  });

  it('treats an unrecognized/invalid locale string as the default (English)', () => {
    const map = new Map([['en', 'English summary']]);
    expect(resolveAiSummary(map, 'fr')).toBe('English summary');
  });

  it('returns undefined when no analysis exists in any locale', () => {
    const map = new Map<string, string>();
    expect(resolveAiSummary(map, 'en')).toBeUndefined();
  });
});
