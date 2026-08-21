import { timeframesDueAt } from '../pairs';

describe('timeframesDueAt', () => {
  it('refreshes M1 on every scheduler pass', () => {
    expect(timeframesDueAt(new Date('2026-08-19T10:07:00Z'))).toEqual(['M1']);
  });

  it('includes only intervals that close on a five-minute boundary', () => {
    expect(timeframesDueAt(new Date('2026-08-19T10:15:00Z'))).toEqual(['M1', 'M5', 'M15']);
  });

  it('includes configured higher intervals on their UTC candle boundaries', () => {
    expect(timeframesDueAt(new Date('2026-08-20T00:00:00Z'))).toEqual(['M1', 'M5', 'M15', 'H1']);
  });
});
