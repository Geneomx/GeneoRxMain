/** Chunk the complete report for device speech limits, retaining paragraph/word order. */
export function speechChunks(text: string, maximum = 3000): string[] {
  const limit = Number.isFinite(maximum) && maximum >= 32 ? Math.min(Math.floor(maximum), 3000) : 3000;
  let remaining = text.trim();
  const chunks: string[] = [];
  while (remaining) {
    let end = Math.min(limit, remaining.length);
    if (end < remaining.length) {
      const boundary = Math.max(remaining.lastIndexOf('\n', end), remaining.lastIndexOf(' ', end));
      if (boundary > end / 2) end = boundary;
      if (/[\uD800-\uDBFF]/.test(remaining.charAt(end - 1))) end -= 1;
    }
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end).trimStart();
  }
  return chunks;
}

export const REPORT_TERM_KEYS = ['adherence', 'strength', 'dose', 'severity', 'unknown', 'pattern', 'interaction', 'nutrient', 'safety'] as const;
