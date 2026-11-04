import { buildCheckinRecord, checkinCalendarDay, checkinEditorKey, createCheckinForm, hasUnfinishedCheckin, readableCheckinDate, replaceEditedCheckin } from '../checkinEditor';
import { dedupeCheckins, normalizeCheckin, wizardToSavePayload } from '../sync';
import { defaultWizardState, type WizardCheckin } from '../types';
import { trackingJourney } from '../trackingJourney';

const original = (): WizardCheckin => ({
  id: 42, clientId: '00000000-0000-4000-8000-000000000042', dateISO: '2026-10-28T16:35:00.000Z',
  adherencePct: 86,
  medicationDoses: [{ medId: 'past-med', medicationName: 'Past medicine', strength: '10 mg', frequency: 'Once daily', status: 'some', scheduled: 7, missed: 1 }],
  supplementsTaken: ['Original supplement'], supplementsPlanned: ['Original supplement', 'Other original supplement'],
  symptoms: { items: [{ symptom: 'Fatigue', change: 'No change', changeScore: 0, severityNow: 0 }], improvementScore: 0 },
  wellbeing: { energy: 0, mood: null, sleep: 6, focus: null, digestive: 2, notes: 'Original wellbeing note' },
  completion: { labs: 'yes', labsDateISO: '2026-10-12T12:00:00.000Z', prescriber: 'no', prescriberDateISO: null, lifestyle: { hydration: 'unsure' } },
  notes: 'Original note', sideEffects: ['Mild discomfort, after breakfast'],
});
const options = { clientId: '00000000-0000-4000-8000-000000000099', dateISO: '2026-10-28T12:00:00.000Z', names: ['Fatigue'], supplements: ['Changed plan'], monthlyDue: true };

test('editing a note retains original doses, zero ratings, plan, event dates and exact timestamp', () => {
  const before = original(); const form = createCheckinForm(before); form.notes = 'Corrected note';
  const result = buildCheckinRecord(form, options);
  expect(result).toMatchObject({ ...before, notes: 'Corrected note' });
  expect(before.notes).toBe('Original note');
  expect(form.doseEntries['past-med']).not.toBe(before.medicationDoses![0]);
});

test('an edit replaces just that record, including when another check-in has the same date', () => {
  const before = original(); const sibling = { ...original(), id: 43, clientId: 'sibling', notes: 'Other check-in' };
  const form = createCheckinForm(before); form.checkinDate = '2026-10-27'; form.notes = 'Corrected';
  const edited = buildCheckinRecord(form, { ...options, dateISO: '2026-10-27T12:00:00.000Z' });
  const saved = replaceEditedCheckin([before, sibling], before, edited);
  expect(saved).toHaveLength(2);
  expect(saved.find(row => row.id === 43)).toEqual(normalizeCheckin(sibling));
  expect(saved.find(row => row.id === 42)).toMatchObject({ dateISO: '2026-10-27T12:00:00.000Z', notes: 'Corrected', clientId: before.clientId });
});

test('retrying an edit of a legacy local record cannot create a duplicate', () => {
  const { id: _id, clientId: _client, ...legacy } = original();
  const form = createCheckinForm(legacy); form.notes = 'Edit before reconnect';
  const first = buildCheckinRecord(form, options);
  const saved = replaceEditedCheckin([legacy], legacy, first);
  const retry = replaceEditedCheckin([{ ...saved[0], id: 70 }], legacy, { ...first, notes: 'Retry correction' });
  expect(retry).toHaveLength(1);
  expect(retry[0]).toMatchObject({ id: 70, clientId: options.clientId, notes: 'Retry correction' });
});

test('a removed record is not resurrected by an unfinished edit', () => {
  expect(() => replaceEditedCheckin([], original(), original())).toThrow('checkin_missing');
});

test('clearing severity does not restore the old score or treat missing as zero', () => {
  const form = createCheckinForm(original()); form.severities = {};
  const result = buildCheckinRecord(form, options);
  expect(result.symptoms.items[0]).not.toHaveProperty('severityNow');
  expect(result.symptoms.items[0].change).toBe('No change');
});

test('legacy adherence survives editing without fabricating per-medicine answers', () => {
  const { medicationDoses: _doses, ...legacy } = original();
  const form = createCheckinForm(legacy); form.notes = 'Edited legacy note';
  const edited = buildCheckinRecord(form, options);
  const state = defaultWizardState(); state.checkins = dedupeCheckins([edited]);
  const payload = wizardToSavePayload(state, []);
  expect(payload.checkins![0].adherencePct).toBe(86);
  expect(payload.checkins![0]).not.toHaveProperty('medicationDoses');
});

test('two server records with identical answers remain distinct', () => {
  const { clientId: _client, ...first } = original();
  expect(dedupeCheckins([first, { ...first, id: 43 }])).toHaveLength(2);
});

test('new check-ins are blank and local draft detection recognizes real zero and explicit uncertainty', () => {
  const blank = createCheckinForm();
  expect(hasUnfinishedCheckin(blank)).toBe(false);
  expect(blank.doseEntries).toEqual({});
  expect(hasUnfinishedCheckin({ ...blank, checkinDate: '2026-01-02' })).toBe(true);
  expect(hasUnfinishedCheckin({ ...blank, wb: { ...blank.wb, energy: 0 } })).toBe(true);
  expect(hasUnfinishedCheckin({ ...blank, doseEntries: { a: { medId: 'a', medicationName: 'A', status: 'unsure' } } })).toBe(true);
  const restored = JSON.parse(JSON.stringify(createCheckinForm(original())));
  expect(buildCheckinRecord(restored, options)).toEqual(buildCheckinRecord(createCheckinForm(original()), options));
});

test('separate same-day drafts use record identity and readable dates keep a year', () => {
  expect(checkinEditorKey(original())).not.toBe(checkinEditorKey({ ...original(), clientId: 'other' }));
  expect(checkinCalendarDay('2026-10-28')).toBe('2026-10-28');
  expect(readableCheckinDate('2026-10-28', 'en-US')).toBe('October 28, 2026');
  expect(readableCheckinDate('invalid')).toBe('');
});

test('Today distinguishes setup, the first check-in, a past record and a saved current-day record', () => {
  const state = defaultWizardState(); const now = new Date('2026-11-02T12:00:00');
  expect(trackingJourney(state, now).stage).toBe('new');
  state.symptomOnlyMode = true;
  expect(trackingJourney(state, now).stage).toBe('first-update');
  state.checkins = [original()];
  expect(trackingJourney(state, now).stage).toBe('returning');
  state.checkins.push({ ...original(), id: 44, clientId: 'today', dateISO: now.toISOString() });
  expect(trackingJourney(state, now).stage).toBe('today');
});
