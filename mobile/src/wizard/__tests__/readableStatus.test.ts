import { reportedDoseStatus } from '../medicationTracking';
import { summaryRows } from '../summaryRows';
import { checkinsInRange } from '../reviewData';
import { defaultWizardState, type MedicationDoseEntry, type WizardCheckin } from '../types';
import { MED_DB } from '@/content/wizardData';
import { translate } from '@/content/i18n';

const t = (key: string, vars?: Record<string, string | number | null | undefined>) => translate(key, 'en', vars);
const dose = (status: MedicationDoseEntry['status'], extra: Partial<MedicationDoseEntry> = {}): MedicationDoseEntry => ({ medId: 'metformin', medicationName: 'Metformin', status, ...extra });
const entry = (dateISO: string, patch: Partial<WizardCheckin> = {}): WizardCheckin => ({ dateISO, adherencePct: null, medicationDoses: [], supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: null, mood: null, sleep: null, focus: null }, sideEffects: [], notes: '', ...patch });

test.each([
  ['legacy percentage is not a dose report', [], 'not-recorded'],
  ['confirmed taken and unscheduled', [dose('all'), dose('not-scheduled')], 'all'],
  ['explicit missed doses', [dose('some', { scheduled: 7, missed: 1 })], 'some'],
  ['mixed known and uncertain answers', [dose('all'), dose('unsure')], 'unsure'],
  ['invalid counts stay uncertain', [dose('some', { scheduled: 7, missed: 10 })], 'unsure'],
  ['nothing scheduled', [dose('not-scheduled')], 'not-scheduled'],
  ['zero missed is not reported as missed', [dose('some', { scheduled: 7, missed: 0 })], 'all'],
] as const)('%s', (_name, entries, status) => {
  expect(reportedDoseStatus(entry('2020-01-10', { adherencePct: 100, medicationDoses: [...entries] }))).toBe(status);
});

test('overview uses the latest wellbeing answers, preserving zero without carrying an old rating forward', () => {
  const state = defaultWizardState();
  state.checkins = [entry('2020-01-09', { wellbeing: { energy: 8, mood: 9, sleep: 7, focus: 8 } }), entry('2020-01-10', { wellbeing: { energy: 0, mood: null, sleep: null, focus: null } })];
  const row = summaryRows(state, t, MED_DB).find(row => row.key === 'wellbeing')!;
  expect(row.value).toBe('Energy: 0/10');
  expect(row.value).not.toContain('9/10');
});
test('overview rows respect the chosen period and do not infer dose or symptom answers', () => {
  const state = defaultWizardState();
  state.meds = [{ medId: 'metformin', dose: 'unknown', durationMonths: 0 }];
  state.symptoms.selected = ['Fatigue'];
  state.checkins = checkinsInRange([entry('2020-01-01', { notes: 'Outside period', medicationDoses: [dose('all')] }), entry('2020-01-10', { notes: 'Inside period' })], '7', new Date(2020, 0, 10));
  const rows = summaryRows(state, t, MED_DB);
  expect(rows.find(row => row.key === 'medications')!.value).toContain('Not answered');
  expect(rows.find(row => row.key === 'symptoms')!.value).toBe('Not recorded in this period');
  expect(rows.find(row => row.key === 'notes')!.value).toBe('Inside period');
  expect(JSON.stringify(rows)).not.toContain('Outside period');
});
test('empty records show recorded-data gaps rather than healthy or zero defaults', () => {
  const rows = summaryRows(defaultWizardState(), t, MED_DB);
  expect(rows).toHaveLength(4);
  expect(rows.find(row => row.key === 'notes')!.value).toBe('No notes recorded');
  expect(rows.find(row => row.key === 'wellbeing')!.value).toBe('Not recorded in this period');
});
