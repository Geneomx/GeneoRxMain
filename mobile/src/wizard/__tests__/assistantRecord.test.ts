import { assistantRecordLines, assistantRecordSnapshot } from '../assistantRecord';
import type { WizardCheckin } from '../types';

const checkin = (dateISO: string, extra: Partial<WizardCheckin> = {}): WizardCheckin => ({
  dateISO,
  adherencePct: null,
  supplementsTaken: [],
  symptoms: { items: [] },
  wellbeing: { energy: null, mood: null, sleep: null, focus: null },
  sideEffects: [],
  notes: '',
  ...extra,
} as WizardCheckin);

describe('assistantRecordLines', () => {
  it('lists the most recent check-ins oldest first, from what the user entered', () => {
    const lines = assistantRecordLines([
      checkin('2026-10-29', { medicationDoses: [{ medId: 'm', medicationName: 'Metformin', status: 'all' }], wellbeing: { energy: 6, mood: 7, sleep: null, focus: null } as never }),
      checkin('2026-10-22', { adherencePct: 80, symptoms: { items: [{ symptom: 'Headache', change: 'Slightly better', changeScore: 1, severityNow: 3 }] } }),
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('2026-10-22 · medicines taken: 80% · symptoms: Headache slightly better (3/10)');
    expect(lines[1]).toBe('2026-10-29 · medicines: Metformin all taken · wellbeing: energy 6/10, mood 7/10');
  });

  it('skips unanswered symptoms, clips long notes and keeps at most the limit', () => {
    const many = Array.from({ length: 12 }, (_, i) => checkin(`2026-09-${String(i + 1).padStart(2, '0')}`));
    expect(assistantRecordLines(many)).toHaveLength(8);
    const [line] = assistantRecordLines([checkin('2026-10-01', { notes: 'x'.repeat(400), symptoms: { items: [{ symptom: 'Nausea', change: 'Not answered', changeScore: 0 }] } })]);
    expect(line).not.toContain('Nausea');
    expect(line.length).toBeLessThanOrEqual(480);
    expect(line).toContain('…');
  });

  it('says so when a check-in has no details', () => {
    expect(assistantRecordLines([checkin('2026-10-01')])[0]).toBe('2026-10-01 · saved with no details');
  });
});

describe('assistantRecordSnapshot', () => {
  it('counts the last 30 days and reports the latest date', () => {
    const now = new Date(2026, 10, 4);
    const snap = assistantRecordSnapshot([checkin('2026-10-29'), checkin('2026-10-10'), checkin('2026-08-01')], now);
    expect(snap).toEqual({ count: 2, latestISO: '2026-10-29', total: 3 });
  });

  it('has nothing to show before the first check-in', () => {
    expect(assistantRecordSnapshot([])).toEqual({ count: 0, latestISO: null, total: 0 });
  });
});
