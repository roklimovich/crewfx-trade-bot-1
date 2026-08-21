import { calculateExpiration } from '../expiration';

describe('calculateExpiration', () => {
  const start = new Date('2026-08-19T10:00:00Z');

  it('creates a three-minute M1 trade idea', () => {
    expect(calculateExpiration('M1', 'MEDIUM', start).toISOString()).toBe(
      '2026-08-19T10:03:00.000Z',
    );
  });

  it('uses a longer M5 validity window only when risk is low', () => {
    expect(calculateExpiration('M5', 'HIGH', start).toISOString()).toBe('2026-08-19T10:05:00.000Z');
    expect(calculateExpiration('M5', 'LOW', start).toISOString()).toBe('2026-08-19T10:10:00.000Z');
  });
});
