import { parseAiAnalysisResponse } from '../schema';

describe('parseAiAnalysisResponse', () => {
  const validResponse = JSON.stringify({
    summary: 'EUR/USD is showing a bullish setup on the 15-minute chart.',
    reasoning:
      'RSI has crossed above 55 while MACD histogram is expanding, both pointing the same direction.',
    riskHighlights:
      'Volatility is currently elevated, which widens the range of plausible short-term outcomes.',
    confidenceEstimate: 78,
  });

  it('parses a well-formed JSON response', () => {
    const result = parseAiAnalysisResponse(validResponse);
    expect(result).not.toBeNull();
    expect(result!.confidenceEstimate).toBe(78);
  });

  it('strips markdown code fences before parsing', () => {
    const fenced = '```json\n' + validResponse + '\n```';
    const result = parseAiAnalysisResponse(fenced);
    expect(result).not.toBeNull();
  });

  it('returns null for malformed JSON', () => {
    const result = parseAiAnalysisResponse('{ this is not valid json');
    expect(result).toBeNull();
  });

  it('returns null when a required field is missing', () => {
    const incomplete = JSON.stringify({ summary: 'Missing other fields.' });
    const result = parseAiAnalysisResponse(incomplete);
    expect(result).toBeNull();
  });

  it('returns null when confidenceEstimate is out of range', () => {
    const outOfRange = JSON.stringify({
      summary: 'A summary that is long enough to pass validation checks.',
      reasoning: 'A reasoning string that is long enough to pass validation checks here.',
      riskHighlights: 'A risk highlight string that is long enough to pass validation.',
      confidenceEstimate: 150, // invalid — must be 0-100
    });
    const result = parseAiAnalysisResponse(outOfRange);
    expect(result).toBeNull();
  });

  it('returns null when fields are too short to be meaningful', () => {
    const tooShort = JSON.stringify({
      summary: 'Hi',
      reasoning: 'ok',
      riskHighlights: 'no',
      confidenceEstimate: 50,
    });
    const result = parseAiAnalysisResponse(tooShort);
    expect(result).toBeNull();
  });
});
