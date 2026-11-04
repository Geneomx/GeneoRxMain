import { compareCheckins } from './checkinOrder';
import type { BodySystemKey, WizardCheckin } from './types';

export type ProgressMeasure = { kind: 'symptom'; name: string } | { kind: 'wellbeing'; name: BodySystemKey };
export type ProgressPoint = { key: string; time: number; value: number | null; record: WizardCheckin };

/** Keep every dated check-in, including unscored and same-day records. Never
 * infer a severity from a reported change or replace a missing answer with zero. */
export function progressPoints(records: WizardCheckin[], measure: ProgressMeasure): ProgressPoint[] {
  return records.map((record, index) => ({ record, index }))
    .filter(({ record }) => Number.isFinite(new Date(record.dateISO).getTime()))
    .sort((a, b) => compareCheckins(a.record, b.record))
    .map(({ record, index }) => {
      const rating = measure.kind === 'wellbeing' ? record.wellbeing?.[measure.name]
        : record.symptoms.items.find(item => item.symptom === measure.name)?.severityNow;
      return {
        key: `${record.clientId || record.id || record.dateISO}:${index}`,
        time: new Date(record.dateISO).getTime(), record,
        value: typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 10 ? rating : null,
      };
    });
}

/** Comparison dates belong to the actual rated records, not the latest
 * unscored check-in. A single rating is not presented as a trend. */
export function progressComparison(points: ProgressPoint[]) {
  const rated = points.filter((point): point is ProgressPoint & { value: number } => point.value !== null);
  return { first: rated[0] ?? null, last: rated.at(-1) ?? null, hasComparison: rated.length > 1 };
}
