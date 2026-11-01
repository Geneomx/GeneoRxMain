import { translate } from '@/content/i18n';
import { checkinsInRange, knownAdherenceAverage, symptomRatingSeries, trackingHealthStory } from '../reviewData';
import { trackingRecordText, trackingSummaryForRange } from '../trackingReport';
import { applyProfileToWizard, applySavePayload, wizardToProfileResponse, wizardToSavePayload } from '../sync';
import { defaultWizardState, type WizardCheckin } from '../types';
import { MED_DB } from '@/content/wizardData';
import { localCalendarDate } from '../calendarDate';

const entry = (dateISO: string, patch: Partial<WizardCheckin> = {}): WizardCheckin => ({ dateISO, adherencePct: null, notes: '', supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: 5, mood: 5, sleep: 5, focus: 5 }, sideEffects: [], ...patch });
const t = (key: string) => key;

test('date filters use inclusive local calendar days and exclude future or invalid entries', () => {
  const now = new Date(2026, 9, 20, 12);
  const records = [entry(new Date(2026, 9, 13, 23, 59).toISOString()), entry(new Date(2026, 9, 14, 0).toISOString()), entry(new Date(2026, 9, 20, 23, 59).toISOString()), entry(new Date(2026, 9, 21, 0).toISOString()), entry('invalid')];
  expect(checkinsInRange(records, '7', now)).toEqual(records.slice(1, 3));
  expect(checkinsInRange(records, 'all', now)).toEqual(records.slice(0, 3));
});
test('known percentage averages retain zero and omit unknown answers', () => {
  expect(knownAdherenceAverage([entry('2026-10-20')])).toBeNull();
  expect(knownAdherenceAverage([entry('2026-10-20'), entry('2026-10-19', { adherencePct: 0, medicationDoses: [{ medId: 'a', medicationName: 'A', status: 'some', scheduled: 1, missed: 1 }] }), entry('2026-10-18', { adherencePct: 100, medicationDoses: [{ medId: 'a', medicationName: 'A', status: 'all' }] })])).toBe(50);
});
test('symptom charts use only explicitly recorded severity values', () => {
  const records = [entry('2026-10-19', { symptoms: { items: [{ symptom: 'Fatigue', change: 'No change', changeScore: 0 }] } }), entry('2026-10-20', { symptoms: { items: [{ symptom: 'Fatigue', change: 'Worse', changeScore: -2, severityNow: 0 }] } })];
  expect(symptomRatingSeries(records).Fatigue).toEqual([[new Date('2026-10-20').getTime(), 0]]);
});
test('preview and shared record include the edited overview and every selected entry only', () => {
  const state = defaultWizardState();
  state.checkins = [entry('2026-10-01', { notes: 'outside range' }), entry('2026-10-19', { notes: 'first included' }), entry('2026-10-20', { notes: 'second included', sideEffects: ['Sample observation'] })];
  const filtered = { ...state, checkins: checkinsInRange(state.checkins, '7', new Date(2026, 9, 20)) };
  const record = trackingRecordText(filtered, 'My edited overview', 'Last 7 days', t, MED_DB);
  expect(record).toContain('My edited overview');
  expect(record).toContain('first included'); expect(record).toContain('second included');
  expect(record).toContain('Sample observation'); expect(record).toContain('checkin.not_answered');
  expect(record).not.toContain('outside range'); expect(record).not.toContain('success_probability');
});
test('the tracking record lists supplements, answered body systems, dose counts and monthly answers, and never prints a skipped one', () => {
  const state = defaultWizardState();
  state.checkins = [entry('2026-10-20', {
    supplementsTaken: ['Magnesium', 'Vitamin D'],
    medicationDoses: [{ medId: 'a', medicationName: 'Medicine A', status: 'some', scheduled: 7, missed: 2 }, { medId: 'b', medicationName: 'Medicine B', status: 'unsure' }],
    wellbeing: { energy: 6, mood: null, sleep: 5, focus: 4, digestive: 0, circulation: null, immunity: 8 },
    completion: { labs: 'yes', prescriber: null, lifestyle: { movement: 'no', hydration: null } },
  })];
  const record = trackingRecordText(state, 'Overview', 'All time', t, MED_DB);
  expect(record).toContain('checkin.detail.supplements_taken: Magnesium, Vitamin D');
  expect(record).toContain('• Medicine A: tracking.dose.some (5/7)');
  expect(record).toContain('• Medicine B: tracking.dose.unsure');
  expect(record).not.toContain('tracking.dose.unsure (');
  expect(record).toContain('wellbeing.mood: checkin.not_answered');
  expect(record).toContain('wellbeing.digestive: 0/10');
  expect(record).toContain('wellbeing.immunity: 8/10');
  expect(record).not.toContain('wellbeing.circulation');
  expect(record).toContain('checkin.monthly_title');
  expect(record).toContain('checkin.labs_q common.yes');
  expect(record).toContain('checkin.lifestyle.movement common.no');
  expect(record).not.toContain('checkin.prescriber_q');
  expect(record).not.toContain('checkin.lifestyle.hydration');
  expect(record).not.toContain('null');
});
test('a legacy check-in with a string side-effects field and no symptom items still renders in the record', () => {
  const state = defaultWizardState();
  state.checkins = [{ dateISO: '2026-10-20', adherencePct: null, notes: '', sideEffects: 'nausea, headache' } as unknown as WizardCheckin];
  const record = trackingRecordText(state, 'Overview', 'All time', t, MED_DB);
  expect(record).toContain('checkin.detail.side_effects: nausea, headache');
  expect(record).toContain('wellbeing.energy: checkin.not_answered');
  expect(record).not.toContain('checkin.monthly_title');
});
test('edited overviews for separate date ranges survive local and server profile conversions', () => {
  const state = defaultWizardState();
  applySavePayload(state, { portal_state: { summaryOverview: { '7': 'This week', '30': 'This month' } } });
  const payload = wizardToSavePayload(state, MED_DB);
  expect(payload.portal_state?.summaryOverview).toEqual(state.summaryOverview);
  const response = wizardToProfileResponse(state, { name: 'Test', email: 'test@example.test' });
  expect(applyProfileToWizard(defaultWizardState(), response).summaryOverview).toEqual(state.summaryOverview);
});
test('calendar dates stay on the local day near midnight', () => {
  expect(localCalendarDate(new Date(2026, 9, 20, 23, 59))).toBe('2026-10-20');
  expect(localCalendarDate(new Date(2026, 9, 20, 0, 1))).toBe('2026-10-20');
});
test('reminder opt-outs survive offline profile conversions without affecting other preferences', () => {
  const state = defaultWizardState(); state.reminderPreferences = { enabled: true };
  applySavePayload(state, { portal_state: { reminderPreferences: { enabled: false } } });
  expect(wizardToSavePayload(state, MED_DB).portal_state?.reminderPreferences).toEqual({ enabled: false });
  const restored = applyProfileToWizard(defaultWizardState(), wizardToProfileResponse(state, { name: 'Test', email: 'test@example.test' }));
  expect(restored.reminderPreferences).toEqual({ enabled: false });
});
test('cleared overview drafts restore generated content rather than an invalid server value', () => {
  const response = wizardToProfileResponse(defaultWizardState(), { name: 'Test', email: 'test@example.test' });
  response.portal_state.summaryOverview = { '7': null, '30': { invalid: true }, all: 'My overview' };
  expect(applyProfileToWizard(defaultWizardState(), response).summaryOverview).toEqual({ '7': '', '30': '', all: 'My overview' });
});

test('assistant summary matches Summary, uses the selected period and preserves unknown adherence', () => {
  const state = defaultWizardState();
  state.symptoms.selected = ['Fatigue'];
  state.summaryOverview = { '7': 'My edited weekly overview' };
  state.checkins = [
    entry('2026-09-01', { notes: 'Outside the selected period' }),
    entry('2026-10-27', { notes: 'Confirmed weekly note', adherencePct: null, sideEffects: ['Recorded nausea'] }),
  ];
  const result = trackingSummaryForRange(state, '7', (key, vars) => translate(key, 'en', vars), MED_DB, new Date(2026, 9, 27));
  expect(result.filtered.checkins).toHaveLength(1);
  expect(result.edited).toBe('My edited weekly overview');
  expect(result.stale).toBe(true);
  expect(result.overview).toBe(result.generated);
  expect(result.text).toContain('Confirmed weekly note');
  expect(result.text).toContain('Recorded nausea');
  expect(result.text).not.toContain('Outside the selected period');
  expect(result.text).not.toContain('0%');
  expect(result.text).not.toContain('probability');
  expect(state.checkins).toHaveLength(2);
});

test('the full health story describes selected-period answers and dates without importing outside ratings', () => {
  const state = defaultWizardState();
  state.meds = [{ medId: 'metformin', dose: 'unknown', durationMonths: 0 }];
  state.symptoms.selected = ['Fatigue'];
  const rated = (dateISO: string, severityNow: number) => entry(dateISO, { symptoms: { items: [{ symptom: 'Fatigue', change: 'No change', changeScore: 0, severityNow }] } });
  state.checkins = [rated('2026-10-01T12:00:00Z', 10), rated('2026-10-25T12:00:00Z', 6), rated('2026-10-29T12:00:00Z', 3), rated('2026-11-01T12:00:00Z', 9)];
  const summary = trackingSummaryForRange(state, '7', (key, vars) => translate(key, 'en', vars), MED_DB, new Date(2026, 9, 30));
  expect(summary.generated).toContain('You reported taking Metformin');
  expect(summary.generated).toContain('2 saved check-ins');
  expect(summary.generated).toContain('6/10'); expect(summary.generated).toContain('3/10');
  expect(summary.generated).not.toContain('10/10'); expect(summary.generated).not.toContain('9/10');
  expect(summary.text).toContain('Your GeneoRx Health Story'); expect(summary.text).toContain('GeneoRx Summary');
});

test('the narrative keeps zero answers and excludes unknown ratings and clinical probability claims', () => {
  const state = defaultWizardState();
  state.checkins = [entry('2026-10-29', { medicationDoses: [{ medId: 'test', medicationName: 'Test', status: 'some', scheduled: 2, missed: 2 }], wellbeing: { energy: 0, mood: null, sleep: null, focus: null } })];
  const story = trackingHealthStory(state, (key, vars) => translate(key, 'en', vars), MED_DB);
  expect(story).toContain('adherence was 0%'); expect(story).toContain('Energy: 0/10');
  expect(story).not.toContain('Mood: 0'); expect(story).not.toMatch(/success probability|depletion|diagnosis/i);
  state.checkins[0].medicationDoses = [{ medId: 'test', medicationName: 'Test', status: 'unsure' }];
  const unknown = trackingHealthStory(state, (key, vars) => translate(key, 'en', vars), MED_DB);
  expect(unknown).toContain('Medication adherence is not known'); expect(unknown).not.toContain('adherence was 0%');
});

test('the complete report restores reference sections while separating rule matches from personal clinical estimates', () => {
  const state = defaultWizardState();
  state.meds = [{ medId: 'metformin', dose: 'unknown', durationMonths: 0 }];
  state.symptoms.selected = ['Fatigue'];
  const report = trackingRecordText(state, 'My full narrative', 'Selected period', (key, vars) => translate(key, 'en', vars), MED_DB);
  for (const heading of ['Your GeneoRx Health Story', 'GeneoRx Summary', 'Safety flags', 'Detected pattern', 'Nutrient information', 'Drug interactions', 'Contraindications & cautions', 'Current recorded supplement plan', 'Optional lab topics to discuss', 'GeneoRx Insight summary']) expect(report).toContain(heading);
  expect(report).toContain('Metformin + B12 pattern');
  expect(report).toContain('do not confirm a deficiency');
  expect(report).toContain('My full narrative');
  expect(report).not.toMatch(/medication success probability|Vitamin B12:.*\d+%/i);
});
