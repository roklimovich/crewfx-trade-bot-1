import { en } from '../locales/en';
import { ru } from '../locales/ru';

/** Recursively collects every "path" through the object (e.g. "auth.login.email") for comparison. */
function collectPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  if (Array.isArray(obj)) {
    return [
      `${prefix}[]:${obj.length}`,
      ...obj.flatMap((item, i) => collectPaths(item, `${prefix}[${i}]`)),
    ];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    collectPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('en/ru message dictionary structural parity', () => {
  it('has identical key structure and array lengths in both locales', () => {
    const enPaths = collectPaths(en).sort();
    const ruPaths = collectPaths(ru).sort();

    // Compare only the STRUCTURE (keys, array lengths) — leaf string VALUES are expected to
    // differ (that's the entire point of a translation). collectPaths already stops descending
    // into leaf string values (typeof !== 'object' returns just the prefix), so what's compared
    // here is exactly the shape, not the translated text.
    const missingInRu = enPaths.filter((p) => !ruPaths.includes(p));
    const extraInRu = ruPaths.filter((p) => !enPaths.includes(p));

    expect(missingInRu).toEqual([]);
    expect(extraInRu).toEqual([]);
  });

  it('has the same number of FAQ items in both locales', () => {
    expect(ru.faq.items.length).toBe(en.faq.items.length);
  });

  it('has the same number of feature cards in both locales', () => {
    expect(ru.features.items.length).toBe(en.features.items.length);
  });

  it('has the same number of pricing tiers, in the same order, in both locales', () => {
    expect(ru.pricing.tiers.map((t) => t.name)).toEqual(en.pricing.tiers.map((t) => t.name));
  });

  it('has no empty string values in either locale (a common copy-paste-and-forget mistake)', () => {
    function findEmpty(obj: unknown, path = ''): string[] {
      if (typeof obj === 'string') return obj.trim() === '' ? [path] : [];
      if (Array.isArray(obj)) return obj.flatMap((v, i) => findEmpty(v, `${path}[${i}]`));
      if (obj && typeof obj === 'object') {
        return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
          findEmpty(v, path ? `${path}.${k}` : k),
        );
      }
      return [];
    }
    expect(findEmpty(en)).toEqual([]);
    expect(findEmpty(ru)).toEqual([]);
  });
});
