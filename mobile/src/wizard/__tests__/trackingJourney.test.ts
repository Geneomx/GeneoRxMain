import { trackingJourney } from '../trackingJourney';
import { defaultWizardState, type WizardCheckin } from '../types';
import { translate } from '@/content/i18n';

const now = new Date(2026, 9, 28, 12);
const checkin = (date: Date): WizardCheckin => ({ dateISO: date.toISOString(), adherencePct: null, medicationDoses: [], supplementsTaken: [], symptoms: { items: [] }, wellbeing: { energy: null, mood: null, sleep: null, focus: null }, sideEffects: [], notes: '' });

test('a new record starts with adding a medicine rather than reviewing empty charts', () => {
  expect(trackingJourney(defaultWizardState(), now)).toMatchObject({ stage: 'new', firstUpdate: true, step: 1 });
});
test('one medicine is enough to start a check-in, without forcing optional details or symptoms', () => {
  const state = defaultWizardState(); state.meds = [{ medId: 'metformin', dose: 'unknown', durationMonths: 0 }];
  expect(trackingJourney(state, now)).toMatchObject({ stage: 'first-update', step: 5 });
});
test('a person who reports no medicines can still record an update', () => {
  const state = defaultWizardState(); state.symptomOnlyMode = true;
  expect(trackingJourney(state, now)).toMatchObject({ stage: 'first-update', step: 5 });
});
test('previously recorded symptoms do not force the person to start over', () => {
  const state = defaultWizardState(); state.symptoms.selected = ['Fatigue'];
  expect(trackingJourney(state, now).step).toBe(5);
});
test('today’s saved update leads to reviewing it rather than accidentally creating another', () => {
  const state = defaultWizardState(); state.checkins = [checkin(new Date(2026, 9, 28, 8))];
  expect(trackingJourney(state, now)).toMatchObject({ stage: 'today', firstUpdate: false, step: 8 });
});
test('returning users keep their history even if the active medication list is now empty', () => {
  const state = defaultWizardState(); state.checkins = [checkin(new Date(2026, 8, 1))];
  expect(trackingJourney(state, now)).toMatchObject({ stage: 'returning', firstUpdate: false, step: 5 });
});
test('latest means latest date, not array order; invalid and future entries cannot mark today complete', () => {
  const state = defaultWizardState(); state.checkins = [checkin(now), checkin(new Date(2026, 9, 20)), checkin(new Date(2099, 1, 1))];
  expect(trackingJourney(state, now).stage).toBe('today');
  state.checkins = [checkin(new Date(2099, 1, 1))];
  expect(trackingJourney(state, now).stage).toBe('new');
});
test('guidance does not change reported answers or impose a separate age-based flow', () => {
  const state = defaultWizardState(); state.profile.age = '82'; const before = JSON.stringify(state);
  expect(trackingJourney(state, now).stage).toBe('new'); expect(JSON.stringify(state)).toBe(before);
  state.profile.age = '25'; expect(trackingJourney(state, now).stage).toBe('new');
});

test('every journey has readable labels in English, Spanish and fallback languages', () => {
  for (const stage of ['new', 'first-update', 'returning', 'today']) {
    for (const lang of ['en', 'es', 'unknown']) {
      for (const field of ['title', 'body', 'action']) {
        const key = `journey.${stage}.${field}`;
        expect(translate(key, lang)).not.toBe(key);
      }
      expect(translate('journey.next_action', lang)).not.toBe('journey.next_action');
    }
  }
});
