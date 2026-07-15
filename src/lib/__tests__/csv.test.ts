import { csvField, buildCsv } from '../csv';

describe('csvField', () => {
  it('leaves plain values unquoted', () => {
    expect(csvField('EUR/USD')).toBe('EUR/USD');
    expect(csvField(87)).toBe('87');
  });

  it('quotes and escapes values containing a comma', () => {
    expect(csvField('a,b')).toBe('"a,b"');
  });

  it('doubles embedded quotes and wraps in quotes', () => {
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('quotes values containing a newline', () => {
    expect(csvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('renders null/undefined as an empty string', () => {
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });
});

describe('buildCsv', () => {
  it('builds a header row followed by data rows', () => {
    const csv = buildCsv(
      ['pair', 'direction'],
      [
        ['EUR/USD', 'BUY'],
        ['GBP/JPY', 'SELL'],
      ],
    );
    expect(csv).toBe('pair,direction\nEUR/USD,BUY\nGBP/JPY,SELL');
  });

  it('escapes fields within rows correctly', () => {
    const csv = buildCsv(['note'], [['contains, a comma']]);
    expect(csv).toBe('note\n"contains, a comma"');
  });
});
