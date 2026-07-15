/** Escapes a single CSV field per RFC 4180 — wraps in quotes and doubles any embedded quotes if the value needs it. */
export function csvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Builds a full CSV document from a header row and an array of already-ordered row value arrays. */
export function buildCsv(columns: readonly string[], rows: unknown[][]): string {
  const lines = [columns.join(','), ...rows.map((row) => row.map(csvField).join(','))];
  return lines.join('\n');
}
