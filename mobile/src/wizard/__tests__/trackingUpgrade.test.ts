import { medicationDurationMonths } from '../medicationTracking';
import { computeNutrientScores } from '../engine';
import { combinedAdherence, adherenceLabel, doseCountsLabel, doseEntryValid, mergeDoseEntry } from '../medicationTracking';
import { normalizeCalendarInput } from '../checkinEntry';
import { createDraftStore } from '../draftStore';
import { applyProfileToWizard, dedupeCheckins, normalizeCheckin, upsertCheckin, wizardToSavePayload, wizardToProfileResponse } from '../sync';
import { defaultWizardState, type MedicationDoseEntry, type WizardCheckin } from '../types';
import { buildTrendSeries } from '../trends';
import { computeMedicationCompletion, computeMedicationSuccessPrediction } from '../engine';
import { medicationSymptomSuggestions, prioritizeSymptomSuggestions } from '../symptomSuggestions';
import { MED_DB } from '@/content/wizardData';

const dose = (patch: Partial<MedicationDoseEntry>): MedicationDoseEntry => ({ medId: 'a', medicationName: 'Medicine A', status: 'unsure', ...patch });
const checkin = (patch: Partial<WizardCheckin> = {}): WizardCheckin => ({ dateISO: '2026-10-20', adherencePct: null, notes: '', supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: 5, mood: 5, sleep: 5, focus: 5 }, sideEffects: [], ...patch });

test('unknown adherence stays distinct from zero and requires real denominators', () => {
  expect(combinedAdherence([dose({ status: 'unsure' })])).toBeNull();
  expect(combinedAdherence([])).toBeNull();
  expect(combinedAdherence([dose({ status: 'not-scheduled' })])).toBeNull();
  expect(combinedAdherence([dose({ status: 'some', scheduled: 7, missed: 7 })])).toBe(0);
  expect(combinedAdherence([dose({ status: 'all' }), dose({ medId: 'b', status: 'some', scheduled: 7, missed: 1 })])).toBeNull();
  expect(combinedAdherence([dose({ status: 'all', scheduled: 14 }), dose({ medId: 'b', status: 'some', scheduled: 7, missed: 1 })])).toBe(95);
  expect(combinedAdherence([dose({ status: 'all' })])).toBe(100);
  expect(doseEntryValid(dose({ status: 'some', scheduled: 7, missed: 8 }))).toBe(false);
  expect(adherenceLabel(null)).toBe('Not sure');
  expect(adherenceLabel(0)).toBe('0%');
});

test('unknown adherence is omitted from scoring and chart percentages', () => {
  const state = defaultWizardState(); state.checkins = [checkin()];
  const completion = computeMedicationCompletion(state);
  expect(completion.components.find(item => item.key === 'adherence')?.score).toBeNull();
  expect(completion.score).toBeNull();
  expect(buildTrendSeries(state.checkins).points[0].adherence).toBeNull();
  const unknownPrediction = computeMedicationSuccessPrediction(state, key => key);
  state.checkins[0].adherencePct = 0;
  expect(computeMedicationSuccessPrediction(state, key => key).score).toBeLessThan(unknownPrediction.score);
});

test('strength, frequency, start date and symptom details survive a profile round trip', () => {
  const state = defaultWizardState();
  state.meds = [{ medId: 'metformin', dose: 'med', durationMonths: 2, strength: '500 mg', frequency: 'Twice daily', startDate: '2026-08-20' }];
  state.symptoms.details = { Fatigue: { onsetDate: '2026-10-01', severity: 'mild', notes: 'Afternoon' } };
  state.symptoms.selected = ['Fatigue'];
  const payload = wizardToSavePayload(state, MED_DB);
  const response = wizardToProfileResponse(state, { name: 'Test', email: 'test@example.com' });
  response.portal_state = payload.portal_state!;
  const restored = applyProfileToWizard(defaultWizardState(), response);
  expect(restored.meds[0]).toEqual(state.meds[0]);
  expect(restored.symptoms.details).toEqual(state.symptoms.details);
});

test('client ids keep distinct check-ins but collapse a replay of the same record', () => {
  const a = checkin({ clientId: 'one' }); const b = checkin({ clientId: 'two' });
  expect(dedupeCheckins([a, a, b])).toHaveLength(2);
});

test('a retried save with the same client id replaces the rejected local copy instead of adding a second record', () => {
  // The form keeps its clientId across a failed sync, so the retry carries the
  // edited answers and the earlier local commit is updated, not duplicated.
  const sessionId = 'form-session-1';
  const firstAttempt = checkin({ clientId: sessionId, notes: 'first attempt', id: 41 });
  const older = checkin({ clientId: 'older', dateISO: '2026-10-13' });
  const afterFirst = upsertCheckin([older], firstAttempt);
  expect(afterFirst).toHaveLength(2);
  const retry = checkin({ clientId: sessionId, notes: 'edited before retry' });
  const afterRetry = upsertCheckin(afterFirst, retry);
  expect(afterRetry).toHaveLength(2);
  const kept = afterRetry.find(c => c.clientId === sessionId)!;
  expect(kept.notes).toBe('edited before retry');
  expect(kept.id).toBe(41);
  // A fresh form session (new clientId) is still a new record.
  expect(upsertCheckin(afterRetry, checkin({ clientId: 'form-session-2' }))).toHaveLength(3);
});

test('switching a medication away from "Missed some" drops its scheduled and missed counts', () => {
  const defaults = dose({});
  const some = mergeDoseEntry(undefined, defaults, { status: 'some' });
  const counted = mergeDoseEntry(mergeDoseEntry(some, defaults, { scheduled: 7 }), defaults, { missed: 2 });
  expect(counted).toMatchObject({ status: 'some', scheduled: 7, missed: 2 });
  expect(doseCountsLabel(counted)).toBe('(5/7)');
  const unsure = mergeDoseEntry(counted, defaults, { status: 'unsure' });
  expect(unsure.status).toBe('unsure');
  expect('scheduled' in unsure).toBe(false);
  expect('missed' in unsure).toBe(false);
  expect(doseCountsLabel(unsure)).toBe('');
  expect(combinedAdherence([unsure])).toBeNull();
  const all = mergeDoseEntry(counted, defaults, { status: 'all' });
  expect(all).not.toHaveProperty('scheduled');
  expect(combinedAdherence([all])).toBe(100);
  // Name and strength carried in the defaults survive every patch.
  expect(all.medicationName).toBe('Medicine A');
});

test('legacy check-in rows are filled with an empty envelope without overwriting stored values', () => {
  const legacy = { clientId: 'old', dateISO: '2026-09-01', adherencePct: 80, notes: 'kept', wellbeing: { energy: 0, mood: 7 }, sideEffects: 'nausea, headache' } as unknown as WizardCheckin;
  const normalized = normalizeCheckin(legacy);
  expect(normalized.symptoms.items).toEqual([]);
  expect(normalized.supplementsTaken).toEqual([]);
  expect(normalized.supplementsPlanned).toEqual([]);
  expect(normalized.medicationDoses).toEqual([]);
  expect(normalized.wellbeing).toEqual({ energy: 0, mood: 7, sleep: null, focus: null, digestive: null, circulation: null, immunity: null });
  expect(normalized.sideEffects).toBe('nausea, headache');
  expect(normalized.notes).toBe('kept');
  expect(normalized.adherencePct).toBe(80);
  expect(normalizeCheckin({ dateISO: '2026-09-02' } as WizardCheckin)).toMatchObject({ sideEffects: [], notes: '', adherencePct: null, symptoms: { items: [] } });
  // Merging server rows applies the same envelope, so readers never dereference a missing field.
  const response = wizardToProfileResponse(defaultWizardState(), { name: 'Test', email: 'test@example.test' });
  response.checkins = [legacy as unknown as (typeof response.checkins)[number]];
  const restored = applyProfileToWizard(defaultWizardState(), response);
  expect(restored.checkins[0].symptoms.items).toEqual([]);
  expect(restored.checkins[0].wellbeing.immunity).toBeNull();
});

test('US date entry normalizes single digits and rejects impossible dates', () => {
  expect(normalizeCalendarInput('2026-1-5')).toBe('2026-01-05');
  expect(normalizeCalendarInput('2026-2-30')).toBeNull();
  expect(normalizeCalendarInput('2026--5')).toBeNull();
});

test('source provenance survives AI ordering and cannot be replaced by provider data', () => {
  const local = medicationSymptomSuggestions([{ medId: 'metformin', dose: 'med', durationMonths: 1 }], MED_DB);
  const ordered = prioritizeSymptomSuggestions(local, [{ symptom: 'Fatigue', sources: [{ url: 'https://invalid.example' }] }]);
  expect(ordered[0].sources?.[0].url).toBe('https://medlineplus.gov/druginfo/meds/a696005.html');
});

test('a local write failure is reported, and a later retry can persist the draft', async () => {
  const storage = { setItem: jest.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValueOnce(undefined) };
  const write = createDraftStore(storage, 'account-test');
  await expect(write({ notes: 'keep this' })).rejects.toThrow('disk full');
  await expect(write({ notes: 'keep this' })).resolves.toBeUndefined();
  expect(storage.setItem).toHaveBeenLastCalledWith('account-test', '{"notes":"keep this"}');
});

test('disk writes are serialized and capture the value at submission time', async () => {
  let release!: () => void;
  const calls: string[] = [];
  const write = createDraftStore({ setItem: async (_key, value) => { calls.push(value); if (calls.length === 1) await new Promise<void>(resolve => { release = resolve; }); } }, 'account-test');
  const first = write({ revision: 1 });
  const draft = { revision: 2 }; const second = write(draft); draft.revision = 3;
  await new Promise<void>(resolve => setImmediate(() => resolve()));
  expect(calls).toEqual(['{"revision":1}']); release();
  await Promise.all([first, second]);
  expect(calls).toEqual(['{"revision":1}', '{"revision":2}']);
});

// PHP encodes an empty associative map as []; named array properties vanish in JSON.
test('a first symptom note survives serialization after an empty PHP details array', () => {
  const response = wizardToProfileResponse(defaultWizardState(), { name: 'Test', email: 'test@example.test' });
  response.portal_state = { symptoms: { custom: [], severity: 'mild', details: [] } };
  const restored = applyProfileToWizard(defaultWizardState(), response);
  restored.symptoms.details!.Fatigue = { onsetDate: '', notes: 'Afternoon fatigue' };
  const payload = JSON.parse(JSON.stringify(wizardToSavePayload(restored, MED_DB)));
  expect(payload.portal_state.symptoms.details.Fatigue.notes).toBe('Afternoon fatigue');
});

test('start dates update calendar duration and unknown scoring inputs are not invented', () => {
  expect(medicationDurationMonths({ startDate: '2026-08-27', durationMonths: 0 }, new Date(2026, 9, 27))).toBe(2);
  expect(medicationDurationMonths({ startDate: '2026-08-28', durationMonths: 0 }, new Date(2026, 9, 27))).toBe(1);
  expect(medicationDurationMonths({ startDate: '2026-02-30', durationMonths: 0 })).toBeNull();
  const state = defaultWizardState();
  state.meds = [{ medId: 'metformin', dose: 'unknown', durationMonths: 0, modelInputsConfirmed: false }];
  state.symptoms.selected = ['Fatigue'];
  expect(computeNutrientScores(state, MED_DB)).toEqual([]);
  const restored = applyProfileToWizard(defaultWizardState(), wizardToProfileResponse(state, { name: 'Test', email: 'test@example.test' }));
  expect(restored.meds[0].dose).toBe('unknown');
  expect(restored.meds[0].modelInputsConfirmed).toBe(false);
});
