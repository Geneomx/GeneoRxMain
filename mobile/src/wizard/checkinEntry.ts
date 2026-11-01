import { isoFromCalendarDate } from './calendarDate';
import type { CheckinSymptomItem, SymptomChange, WizardCheckin } from './types';

/** A severity answer does not assert that the symptom stayed the same. */
export function checkinSymptomItems(names: string[], changes: Record<string, SymptomChange>, severities: Record<string, number>): CheckinSymptomItem[] {
  const scores: Record<SymptomChange, number> = { Worse: -2, 'No change': 0, 'Slightly better': 1, 'Much better': 2, 'Not present': 0 };
  return [...new Set(names)].flatMap(symptom => {
    const change = changes[symptom];
    const severity = severities[symptom];
    const rated = Number.isInteger(severity) && severity >= 0 && severity <= 10;
    return !change && !rated ? [] : [{ symptom, change: change || 'Not answered', changeScore: change ? scores[change] : 0, ...(rated ? { severityNow: severity } : {}) }];
  });
}

/** A saved update needs an explicit answer; unknown choices count, missing values do not. */
export function hasCheckinAnswers(checkin: Pick<WizardCheckin, 'medicationDoses' | 'symptoms' | 'wellbeing' | 'notes' | 'sideEffects' | 'supplementsTaken' | 'completion'>): boolean {
  return !!(checkin.medicationDoses?.length || checkin.symptoms?.items?.length ||
    Object.values(checkin.wellbeing || {}).some(value => typeof value === 'number' && Number.isFinite(value)) ||
    checkin.notes?.trim() || checkin.sideEffects?.some(value => value.trim()) || checkin.supplementsTaken?.length ||
    checkin.completion?.labs || checkin.completion?.prescriber || Object.values(checkin.completion?.lifestyle || {}).some(Boolean));
}

/** Only explicitly entered dose counts produce an adherence percentage. */
export function adherenceFromDoses(scheduled: string, missed: string): number | null {
  if (!/^\d+$/.test(scheduled) || !/^\d+$/.test(missed)) return null;
  const total = Number(scheduled);
  const omitted = Number(missed);
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(omitted) || total < 1 || omitted > total) return null;
  return Math.round(((total - omitted) / total) * 100);
}

export function adherenceFromEstimate(value: string): number | null {
  if (!/^\d{1,3}$/.test(value)) return null;
  const percentage = Number(value);
  return percentage <= 100 ? percentage : null;
}

export function normalizeCalendarInput(value: string): string | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (!match) return null;
  const normalized = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  return isoFromCalendarDate(normalized) ? normalized : null;
}
