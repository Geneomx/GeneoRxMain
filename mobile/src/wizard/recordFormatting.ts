import type { TranslateFn } from './engine';
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function sideEffectList(v: string[] | string | null | undefined): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

export function impactLabel(change: string, t: TranslateFn): string {
  const map: Record<string, string> = {
    Worse: 'impact.worse',
    'No change': 'impact.no_change',
    'Slightly better': 'impact.slightly_better',
    'Much better': 'impact.much_better',
    'Not present': 'impact.not_present',
    'Not answered': 'checkin.not_answered',
  };
  return map[change] ? t(map[change]) : String(change || '');
}
