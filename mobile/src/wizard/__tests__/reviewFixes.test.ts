import { translate } from '@/content/i18n';
import { MED_DB } from '@/content/wizardData';
import { computeNutrientScores } from '../engine';
import { buildClinicianSnapshotText } from '../trackingReport';
import { defaultWizardState, type WizardCheckin } from '../types';
import { checkinsInRange, knownAdherenceAverage, reviewHighlights, summaryBasis } from '../reviewData';
import { trackingSummaryForRange } from '../trackingReport';
import { isPastOrToday } from '../calendarDate';
import { applyProfileToWizard, wizardToProfileResponse } from '../sync';

const t = (key: string, vars?: Record<string, string | number | undefined | null>) => translate(key, 'en', vars);
const entry = (dateISO: string, patch: Partial<WizardCheckin> = {}): WizardCheckin => ({ dateISO, adherencePct: null, notes: '', supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: null, mood: null, sleep: null, focus: null }, sideEffects: [], ...patch });

test('empty and symptoms-only records do not generate nutrient deficiency or supplement signals', () => {
  const state = defaultWizardState();
  expect([state.wellbeingBaseline.energy, state.wellbeingBaseline.mood, state.wellbeingBaseline.sleep, state.wellbeingBaseline.focus]).toEqual([5, 5, 5, 5]);
  expect([state.wellbeingBaseline.digestive, state.wellbeingBaseline.circulation, state.wellbeingBaseline.immunity]).toEqual([null, null, null]);
  state.symptoms.selected = ['Custom symptom']; state.symptomOnlyMode = true;
  expect(computeNutrientScores(state)).toEqual([]);
  expect(buildClinicianSnapshotText(state, t)).not.toMatch(/probability|\d+%|Magnesium|B vitamins/);
});
test('legacy supplement percentages do not masquerade as medication adherence', () => {
  const records = [entry('2026-10-20', { adherencePct: 100 }), entry('2026-10-21', { adherencePct: 0, medicationDoses: [{ medId: 'a', medicationName: 'A', status: 'unsure' }] })];
  expect(knownAdherenceAverage(records)).toBeNull();
  records.push(entry('2026-10-22', { medicationDoses: [{ medId: 'a', medicationName: 'A', status: 'some', scheduled: 7, missed: 7 }] }));
  expect(knownAdherenceAverage(records)).toBe(0);
});
test('the snapshot includes actual symptom ratings and notes without a success score', () => {
  const state = defaultWizardState(); state.checkins = [entry('2026-10-20', { notes: 'Recorded note', sideEffects: ['Reported nausea'], symptoms: { items: [{ symptom: 'Fatigue', change: 'Worse', changeScore: -2, severityNow: 7 }] } })];
  const text = buildClinicianSnapshotText(state, t);
  expect(text).toContain('Reported nausea'); expect(text).toContain('Recorded note'); expect(text).toContain('7/10'); expect(text).not.toMatch(/success probability|risk signal/i);
});
test('summary highlights use dated entries and do not carry an old medication answer into a skipped latest check-in', () => {
  const state = defaultWizardState(); state.meds = [{ medId: 'metformin', dose: 'unknown', durationMonths: 0 }];
  state.checkins = [entry('2026-10-21', { medicationDoses: [{ medId: 'metformin', medicationName: 'Metformin', status: 'all' }] }), entry('2026-10-22')];
  const view = reviewHighlights(state, t, MED_DB);
  expect(view.medications[0].status).toBe(t('checkin.not_answered'));
  expect(view.medications[0].counts).toContain('1 all taken');
});
test('saved overview provenance survives synchronization and becomes stale after records change', () => {
  const state = defaultWizardState(); const now = new Date(2026, 9, 28);
  state.summaryOverview = { '7': 'My overview' }; state.summaryOverviewBasis = { '7': summaryBasis(state, '7', now) };
  const restored = applyProfileToWizard(defaultWizardState(), wizardToProfileResponse(state, { name: 'Test', email: 'test@example.test' }));
  expect(trackingSummaryForRange(restored, '7', t, MED_DB, now).stale).toBe(false);
  restored.checkins.push(entry('2026-10-27'));
  expect(trackingSummaryForRange(restored, '7', t, MED_DB, now).stale).toBe(true);
});
test('calendar entry accepts today and rejects impossible or future dates', () => {
  const now = new Date(2026, 9, 28, 1);
  expect(isPastOrToday('2026-10-28', now)).toBe(true);
  expect(isPastOrToday('2026-10-29', now)).toBe(false);
  expect(isPastOrToday('2026-02-30', now)).toBe(false);
  expect(checkinsInRange([entry('2099-01-01')], 'all', now)).toEqual([]);
});

test('a skipped latest severity does not inherit an older numeric rating in Summary', () => {
  const state = defaultWizardState(); state.symptoms.selected = ['Fatigue'];
  state.checkins = [entry('2026-10-20', { symptoms: { items: [{ symptom: 'Fatigue', change: 'No change', changeScore: 0, severityNow: 7 }] } }), entry('2026-10-21', { symptoms: { items: [{ symptom: 'Fatigue', change: 'Slightly better', changeScore: 1 }] } })];
  const view = reviewHighlights(state, t, MED_DB).symptoms[0];
  expect(view.status).toBe(t('impact.slightly_better')); expect(view.rating).toBe(''); expect(view.date).toBe('2026-10-21');
});
