import { MED_DB } from '@/content/wizardData';
import { translate } from '@/content/i18n';
import { defaultWizardState, type WizardCheckin } from '../types';
import { symptomEntryDraft, medicationLabelDraft, explainTrackingProgress } from '../entryAssistance';
import { wellbeingRatingSeries } from '../reviewData';
import { trackingRecordText } from '../trackingReport';
import { buildTrendSeries } from '../trends';

const t = (key: string, vars?: Record<string, string | number | null | undefined>) => translate(key, 'en', vars);
const record = (dateISO: string, energy: number | null): WizardCheckin => ({ dateISO, adherencePct: null, notes: '', supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy, mood: null, sleep: null, focus: null }, sideEffects: [] });

test('entry drafts exclude negated symptoms and use only explicitly described changes', () => {
  const result = symptomEntryDraft('No nausea and not dizzy. Fatigue is better; headache is worse.', []);
  expect(result.names).toEqual(['Fatigue', 'Headache']);
  expect(result.changes).toEqual({ Fatigue: 'Slightly better', Headache: 'Worse' });
  expect(result.notes).toBe('No nausea and not dizzy. Fatigue is better; headache is worse.');
});
test('entry drafts treat contractions and "-free" as denials of a symptom', () => {
  expect(symptomEntryDraft("I don't have a headache", []).names).toEqual([]);
  expect(symptomEntryDraft("haven't had any nausea", []).names).toEqual([]);
  expect(symptomEntryDraft('headache-free today', []).names).toEqual([]);
  expect(symptomEntryDraft('no headache or dizziness', []).names).toEqual([]);
  expect(symptomEntryDraft('headache is worse', [])).toMatchObject({ names: ['Headache'], changes: { Headache: 'Worse' } });
});
test('a negated change word keeps the symptom but sets no change', () => {
  expect(symptomEntryDraft('headache is not better', [])).toMatchObject({ names: ['Headache'], changes: {} });
  expect(symptomEntryDraft('nausea is no worse', [])).toMatchObject({ names: ['Nausea'], changes: {} });
});
test('drafts do not infer severity, medicine adherence or a cause', () => {
  const result = symptomEntryDraft('I feel tired after taking my medicine.', ['Fatigue']);
  expect(result.names).toEqual(['Fatigue']);
  expect(result.changes).toEqual({});
  expect(Object.keys(result).sort()).toEqual(['changes', 'names', 'notes']);
});
test('literal label reading identifies a brand and retains its exact instructions', () => {
  const result = medicationLabelDraft('GLUCOPHAGE 500 mg\nTake one tablet twice daily with food.', MED_DB);
  expect(result.matches.map(m => m.id)).toEqual(['metformin']);
  expect(result.strength).toBe('500 mg');
  expect(result.frequency).toBe('Take one tablet twice daily with food.');
});
test('multiple medicines never get a shared inferred strength or frequency', () => {
  const result = medicationLabelDraft('Metformin 500 mg\nAtorvastatin 10 mg\nTake daily.', MED_DB);
  expect(result.matches).toHaveLength(2);
  expect(result.strength).toBe(''); expect(result.frequency).toBe('');
});
test('unknown wellbeing stays unknown in charts, explanations and exports', () => {
  const state = defaultWizardState();
  state.checkins = [record('2026-10-25', 0), record('2026-10-26', null), record('2026-10-27', 8)];
  expect(wellbeingRatingSeries(state.checkins, 'energy').map(point => point[1])).toEqual([0, 8]);
  expect(buildTrendSeries(state.checkins).points[1].energy).toBeNull();
  const text = trackingRecordText({ ...state, checkins: [state.checkins[1]] }, '', '', t, MED_DB);
  expect(text).toContain('Not answered'); expect(text).not.toContain('null/10'); expect(text).not.toContain('0/10');
  const explanation = explainTrackingProgress(state, '7', t, new Date(2026, 9, 27));
  expect(explanation).toContain('3 check-ins had an unknown');
  expect(explanation).toContain('0/10'); expect(explanation).toContain('8/10');
  expect(explanation).not.toContain('0%');
});
