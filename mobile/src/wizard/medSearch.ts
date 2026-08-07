import type { MedEntry } from '@/content/wizardData';

/** Strip case, accents and punctuation so "Toprol-XL" matches "toprol xl". */
export function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface MedMatch {
  med: MedEntry;
  /** The brand name that matched, when it wasn't the generic name. */
  matchedAlias?: string;
}

/**
 * Rank a term against one medication.
 * Lower is better; null means no match.
 *   0  generic name starts with the term
 *   1  a word inside the generic name starts with the term
 *   2  generic name contains the term
 *   3  brand name starts with the term
 *   4  brand name contains the term
 *   5  slug contains the term
 */
function scoreOf(med: MedEntry, term: string): { rank: number; alias?: string } | null {
  const name = normalize(med.name);
  if (name.startsWith(term)) return { rank: 0 };
  if (name.split(' ').some((w) => w.startsWith(term))) return { rank: 1 };
  if (name.includes(term)) return { rank: 2 };

  for (const alias of med.aliases ?? []) {
    const a = normalize(alias);
    if (a.startsWith(term)) return { rank: 3, alias };
    if (a.split(' ').some((w) => w.startsWith(term))) return { rank: 3, alias };
    if (a.includes(term)) return { rank: 4, alias };
  }

  if (normalize(med.id).includes(term)) return { rank: 5 };
  return null;
}

/**
 * Search the catalog by generic name, brand name or slug.
 * Results are ranked best-first; an empty query returns everything A–Z.
 */
export function searchMeds(catalog: MedEntry[], query: string, limit = 0): MedMatch[] {
  const term = normalize(query);
  const list = catalog || [];

  if (!term) {
    const all = [...list].sort((a, b) => a.name.localeCompare(b.name)).map((med) => ({ med }));
    return limit > 0 ? all.slice(0, limit) : all;
  }

  const scored: { med: MedEntry; rank: number; alias?: string }[] = [];
  for (const med of list) {
    const s = scoreOf(med, term);
    if (s) scored.push({ med, rank: s.rank, alias: s.alias });
  }

  scored.sort((a, b) => a.rank - b.rank || a.med.name.localeCompare(b.med.name));
  const out = scored.map(({ med, alias }) => ({ med, matchedAlias: alias }));
  return limit > 0 ? out.slice(0, limit) : out;
}
