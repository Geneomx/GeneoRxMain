import { translate } from '@/content/i18n';
import { latestUpdate } from '../latestUpdate';
import type { TranslateFn } from '../engine';
import type { WizardCheckin } from '../types';

const t: TranslateFn = (key, vars) => translate(key, 'en', vars);
const now = new Date(2026, 9, 28, 12);
const entry = (dateISO: string, patch: Partial<WizardCheckin> = {}): WizardCheckin => ({ dateISO, adherencePct: null, notes: '', supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: null, mood: null, sleep: null, focus: null }, sideEffects: [], ...patch });

test('empty, future and invalid entries never create a current status', () => {
  expect(latestUpdate([], t, now).checkin).toBeNull();
  expect(latestUpdate([entry('invalid'), entry('2026-10-29')], t, now).checkin).toBeNull();
});

test('uses the latest dated check-in without mutating order or filling missing answers from older records', () => {
  const current = entry('2026-10-27', { adherencePct: 100 });
  const previous = entry('2026-10-20', { medicationDoses: [{ medId: 'a', medicationName: 'Medicine A', status: 'all' }], symptoms: { items: [{ symptom: 'Fatigue', change: 'Much better', changeScore: 2, severityNow: 2 }] } });
  const records = [current, previous];
  const result = latestUpdate(records, t, now);
  expect(result.checkin).toBe(current);
  expect(result.medications).toBe('Not recorded in this check-in');
  expect(result.symptoms).toBe('Not recorded in this check-in');
  expect(result.progress).toBe('No comparison recorded yet');
  expect(result.progressItems).toEqual([]);
  expect(result.medicationLines).toEqual([]);
  expect(result.medicationEntries).toEqual([]);
  expect(result.symptomEntries).toEqual([]);
  expect(records).toEqual([current, previous]);
});

test('missed and uncertain medications remain visible ahead of taken entries, with an explicit more count', () => {
  const record = entry('2026-10-27', { medicationDoses: [
    { medId: 'a', medicationName: 'Medicine A', status: 'all' },
    { medId: 'b', medicationName: 'Medicine B', status: 'unsure' },
    { medId: 'c', medicationName: 'Medicine C', status: 'some', scheduled: 7, missed: 2 },
  ] });
  expect(latestUpdate([record], t, now).medications).toBe('Medicine C: Missed some · Medicine B: Not sure · +1 more');
  expect(latestUpdate([record], t, now).medicationEntries.map(item => item.tone)).toEqual(['warning', 'neutral', 'positive']);
  expect(record.medicationDoses?.[0].medId).toBe('a');
});

test('unscheduled medication does not become taken, and zero severity remains a recorded value', () => {
  const result = latestUpdate([entry('2026-10-27', {
    medicationDoses: [{ medId: 'a', medicationName: 'Medicine A', status: 'not-scheduled' }],
    symptoms: { items: [{ symptom: 'Nausea', change: 'Not present', changeScore: 0, severityNow: 0 }] },
  })], t, now);
  expect(result.medications).toBe('Medicine A: No doses scheduled');
  expect(result.medicationEntries[0].tone).toBe('neutral');
  expect(result.symptomEntries[0]).toMatchObject({ name: 'Nausea', status: 'Not present', severity: 0, tone: 'neutral' });
  expect(result.symptoms).toContain('Nausea severity: 0/10');
  expect(result.progress).toBe('1 not present');
  expect(result.progress).not.toContain('better');
});

test('reports mixed symptom changes instead of collapsing them into a reassuring overall score', () => {
  const items: WizardCheckin['symptoms']['items'] = [
    { symptom: 'Fatigue', change: 'Much better', changeScore: 2, severityNow: 4 },
    { symptom: 'Nausea', change: 'Worse', changeScore: -2 },
    { symptom: 'Headache', change: 'No change', changeScore: 0 },
  ];
  const result = latestUpdate([entry('2026-10-27', { symptoms: { items } })], t, now);
  expect(result.symptoms.startsWith('Nausea: Worse')).toBe(true);
  expect(result.progress).toBe('1 worse · 1 better · 1 unchanged');
  expect(result.progressItems).toEqual([
    { kind: 'worse', text: '1 worse' },
    { kind: 'better', text: '1 better' },
    { kind: 'unchanged', text: '1 unchanged' },
  ]);
  expect(result.symptomLines).toHaveLength(3);
  expect(result.symptomEntries.map(item => item.tone)).toEqual(['negative', 'neutral', 'positive']);
});

test('compares only explicitly recorded wellbeing values with a dated previous value', () => {
  const result = latestUpdate([
    entry('2026-10-20', { wellbeing: { energy: 0, mood: null, sleep: null, focus: null } }),
    entry('2026-10-27', { wellbeing: { energy: 2, mood: null, sleep: null, focus: null } }),
  ], t, now);
  expect(result.progress).toContain('Energy: 2 points higher since');
  expect(result.progress).toContain('Oct 20');
  expect(latestUpdate([entry('2026-10-27', { wellbeing: { energy: 2, mood: null, sleep: null, focus: null } })], t, now).progress).toBe('No comparison recorded yet');
});

test('shows only the latest notes and preserves legacy reported side-effect notes', () => {
  const legacy = { dateISO: '2026-10-27', adherencePct: 90, notes: 'After lunch.', sideEffects: 'Nausea, headache' } as unknown as WizardCheckin;
  const result = latestUpdate([entry('2026-10-20', { notes: 'Old note' }), legacy], t, now);
  expect(result.notes).toContain('Reported changes: Nausea, headache');
  expect(result.notes).toContain('After lunch.');
  expect(result.notes).not.toContain('Old note');
  expect(result.medications).not.toContain('90');
});
