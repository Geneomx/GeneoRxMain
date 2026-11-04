import { localCalendarDate, isoFromCalendarDate, todayISO } from './calendarDate';
import { checkinSymptomItems } from './checkinEntry';
import { combinedAdherence } from './medicationTracking';
import { sideEffectList } from './recordFormatting';
import { dedupeCheckins } from './sync';
import type { LifestyleKey, MedicationDoseEntry, Rating, SymptomChange, TriState, Wellbeing, WizardCheckin } from './types';

/** A form draft is local only. It is never part of a profile or AI payload. */
export interface CheckinFormDraft {
  original: WizardCheckin | null;
  clientId: string | null;
  checkinDate: string;
  doseEntries: Record<string, MedicationDoseEntry>;
  taken: string[];
  changes: Record<string, SymptomChange>;
  severities: Record<string, number>;
  wb: Wellbeing;
  digestive: Rating; circulation: Rating; immunity: Rating;
  labsDone: TriState | null; prescriberSeen: TriState | null;
  lifestyle: Partial<Record<LifestyleKey, TriState | null>>;
  sideEffects: string; notes: string; stagedSymptoms: string[];
}

export function checkinEditorKey(record: WizardCheckin | null): string {
  return record ? record.clientId ? `client:${record.clientId}` : record.id != null ? `id:${record.id}` : `legacy:${JSON.stringify(record)}` : 'new';
}

export function checkinCalendarDay(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : localCalendarDate(new Date(iso));
}

export function createCheckinForm(original: WizardCheckin | null = null): CheckinFormDraft {
  const items = original?.symptoms?.items || [];
  return {
    original, clientId: original?.clientId || null,
    checkinDate: original ? checkinCalendarDay(original.dateISO) : todayISO(),
    doseEntries: Object.fromEntries((original?.medicationDoses || []).map(entry => [entry.medId, { ...entry }])),
    taken: [...(original?.supplementsTaken || [])],
    changes: Object.fromEntries(items.filter(item => item.change && item.change !== 'Not answered').map(item => [item.symptom, item.change as SymptomChange])),
    severities: Object.fromEntries(items.filter(item => typeof item.severityNow === 'number').map(item => [item.symptom, item.severityNow!])),
    wb: { energy: null, mood: null, sleep: null, focus: null, ...original?.wellbeing },
    digestive: original?.wellbeing?.digestive ?? null,
    circulation: original?.wellbeing?.circulation ?? null,
    immunity: original?.wellbeing?.immunity ?? null,
    labsDone: original?.completion?.labs ?? null,
    prescriberSeen: original?.completion?.prescriber ?? null,
    lifestyle: { ...original?.completion?.lifestyle },
    sideEffects: sideEffectList(original?.sideEffects).join(', '), notes: original?.notes || '', stagedSymptoms: [],
  };
}

export function hasUnfinishedCheckin(draft?: CheckinFormDraft): boolean {
  return !!draft && !!(draft.original || draft.checkinDate !== todayISO() || Object.keys(draft.doseEntries).length || draft.taken.length || Object.keys(draft.changes).length ||
    Object.keys(draft.severities).length || Object.values(draft.wb).some(v => v !== null && v !== undefined && v !== '') ||
    [draft.digestive, draft.circulation, draft.immunity, draft.labsDone, draft.prescriberSeen].some(v => v !== null) ||
    Object.values(draft.lifestyle).some(Boolean) || draft.notes.trim() || draft.sideEffects.trim() || draft.stagedSymptoms.length);
}

export function buildCheckinRecord(form: CheckinFormDraft, options: {
  clientId: string; dateISO: string; names: string[]; supplements: string[]; monthlyDue: boolean;
}): WizardCheckin {
  const original = form.original;
  // Keep the exact original timestamp when its calendar date wasn't changed.
  const dateISO = original && checkinCalendarDay(original.dateISO) === form.checkinDate ? original.dateISO : options.dateISO;
  const doses = Object.values(form.doseEntries);
  const items = checkinSymptomItems(options.names, form.changes, form.severities).map(item => {
    const { severityNow: _severity, change: _change, changeScore: _score, ...extra } = original?.symptoms.items.find(previous => previous.symptom === item.symptom) || {};
    return { ...extra, ...item };
  });
  const record: WizardCheckin = {
    ...original, clientId: original?.clientId || options.clientId, dateISO,
    adherencePct: original && !doses.length ? original.adherencePct : combinedAdherence(doses),
    medicationDoses: doses,
    supplementsTaken: [...form.taken],
    supplementsPlanned: original ? original.supplementsPlanned : [...options.supplements],
    symptoms: { ...original?.symptoms, items, improvementScore: items.reduce((sum, item) => sum + (item.changeScore || 0), 0) },
    wellbeing: { ...form.wb, digestive: form.digestive, circulation: form.circulation, immunity: form.immunity },
    sideEffects: original && form.sideEffects === sideEffectList(original.sideEffects).join(', ') ? original.sideEffects : sideEffectList(form.sideEffects),
    notes: form.notes,
  };
  if (options.monthlyDue || original?.completion) {
    const previous = original?.completion;
    record.completion = {
      ...previous, labs: form.labsDone, prescriber: form.prescriberSeen, lifestyle: { ...form.lifestyle },
      labsDateISO: form.labsDone === 'yes' ? previous?.labs === 'yes' ? previous.labsDateISO : dateISO : null,
      prescriberDateISO: form.prescriberSeen === 'yes' ? previous?.prescriber === 'yes' ? previous.prescriberDateISO : dateISO : null,
    };
  }
  // Old records can have an adherence estimate without dose-level answers.
  if (original && !doses.length && original.adherencePct !== null) delete record.medicationDoses;
  return record;
}

export function replaceEditedCheckin(records: WizardCheckin[], original: WizardCheckin, edited: WizardCheckin): WizardCheckin[] {
  const index = records.findIndex(record => (original.clientId && record.clientId === original.clientId) ||
    (original.id != null && record.id === original.id) || (edited.clientId && record.clientId === edited.clientId) || JSON.stringify(record) === JSON.stringify(original));
  if (index < 0) throw new Error('checkin_missing');
  const current = records[index];
  return dedupeCheckins(records.map((record, i) => i === index ? {
    ...edited, ...(current.id != null ? { id: current.id } : {}), clientId: current.clientId || edited.clientId,
  } : record));
}

/** Month names and an explicit year avoid ambiguous US/international dates. */
export function readableCheckinDate(iso: string, language = 'en'): string {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? isoFromCalendarDate(iso) || NaN : iso);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString(language, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
}
