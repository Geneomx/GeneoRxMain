import type { MedEntry } from '@/content/wizardData';
import type { TranslateFn } from './engine';
import { fmtDate } from './recordFormatting';
import { checkinsInRange, knownAdherenceAverage, type ReviewRange } from './reviewData';
import { medicationAdherence } from './medicationTracking';
import { isoFromCalendarDate } from './calendarDate';
import { BODY_SYSTEM_KEYS, type WizardCheckin, type WizardState } from './types';

export type ProgressFact = { id: string; title: string; text: string; records: WizardCheckin[] };
const valid = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10;

/** Each comparison carries its actual source records, never interpolated points or causal claims. */
export function progressExplanationFacts(state: WizardState, range: ReviewRange, t: TranslateFn, catalog: MedEntry[] = [], measure?: string, now = new Date()): ProgressFact[] {
  const records = checkinsInRange(state.checkins, range, now);
  if (!records.length) return [];
  const facts: ProgressFact[] = [];
  const symptoms = [...new Set(records.flatMap(record => record.symptoms.items.map(item => item.symptom)))];
  for (const name of symptoms) {
    if (measure && measure !== name && measure !== `symptom:${name}`) continue;
    const rated = records.flatMap(record => { const value = record.symptoms.items.find(item => item.symptom === name)?.severityNow; return valid(value) ? [{ record, value }] : []; });
    if (rated.length < 2) continue;
    const first = rated[0], last = rated.at(-1)!;
    facts.push({ id: `symptom:${name}`, title: name, text: t('easy.explain_rating', { symptom: name, first: first.value, last: last.value, from: fmtDate(first.record.dateISO), to: fmtDate(last.record.dateISO) }), records: [first.record, last.record] });
  }
  for (const key of BODY_SYSTEM_KEYS) {
    if (measure && measure !== key && measure !== `wellbeing:${key}`) continue;
    const rated = records.filter(record => valid(record.wellbeing[key]));
    if (rated.length < 2) continue;
    const first = rated[0], last = rated.at(-1)!;
    const label = t('wellbeing.' + key).replace(/\s*\([^)]*\)\s*$/, '');
    facts.push({ id: `wellbeing:${key}`, title: label, text: t('easy.explain_rating', { symptom: label, first: first.wellbeing[key]!, last: last.wellbeing[key]!, from: fmtDate(first.dateISO), to: fmtDate(last.dateISO) }), records: [first, last] });
  }
  if (!facts.length) facts.push({ id: 'not-enough', title: t('assist.comparison_title'), text: t('review.not_enough_ratings'), records: [] });
  const known = records.filter(record => medicationAdherence(record) !== null);
  const average = knownAdherenceAverage(records);
  facts.push({ id: 'medicines', title: t('assist.medicines_taken'), text: [average === null ? t('parity.unknown_overview') : t('review.average_taken', { value: average }), t('assist.known_count', { known: known.length, total: records.length })].join(' '), records: [] });
  const start = range === 'all' ? -Infinity : new Date(now.getFullYear(), now.getMonth(), now.getDate() - Number(range) + 1).getTime();
  for (const med of state.meds) {
    const iso = isoFromCalendarDate(med.startDate || '');
    if (!iso || new Date(iso).getTime() < start || new Date(iso).getTime() > now.getTime()) continue;
    const name = catalog.find(item => item.id === med.medId)?.name || med.medId;
    facts.push({ id: `start:${med.medId}`, title: t('assist.medication_timing'), text: t('assist.recorded_start', { name, date: fmtDate(iso) }), records: [] });
  }
  return facts;
}
