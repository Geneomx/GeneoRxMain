import { defaultWizardState, type WizardCheckin } from '../types';
import { adjacentSetupStep, needsSetup, readSetupProgress, resumeSetupStep, setupCheckinKey, setupRecord, setupSteps, type SetupProgress } from '../setupFlow';

const progress: SetupProgress = { version: 1, status: 'in-progress', step: 5 };
const record = { clientId: 'first-record', dateISO: '2026-11-03T12:00:00Z' } as WizardCheckin;

test('a fresh guest starts with optional personal details and visits every tracking screen in order', () => {
  const state = defaultWizardState();
  expect(needsSetup(state, null)).toBe(true);
  expect(resumeSetupStep(state, null, true)).toBe(0);
  expect(setupSteps(true)).toEqual([0, 1, 2, 3, 5, 4, 6, 8]);
  expect(adjacentSetupStep(1, true, 1)).toBe(2);
  expect(adjacentSetupStep(2, true, 1)).toBe(3);
  expect(adjacentSetupStep(3, true, 1)).toBe(5);
  expect(adjacentSetupStep(5, true, 1)).toBe(4);
  expect(adjacentSetupStep(4, true, 1)).toBe(6);
  expect(adjacentSetupStep(6, true, 1)).toBe(8);
  expect(adjacentSetupStep(8, true, 1)).toBeNull();
});

test('back follows the same order and registered users do not see the guest account form', () => {
  expect(setupSteps(false)).toEqual([1, 2, 3, 5, 4, 6, 8]);
  expect(adjacentSetupStep(1, false, -1)).toBeNull();
  expect(adjacentSetupStep(4, true, -1)).toBe(5);
  expect(adjacentSetupStep(5, true, -1)).toBe(3);
});

test('existing first-time medicine data resumes at medicines instead of jumping to check-in', () => {
  const state = defaultWizardState();
  state.symptomOnlyMode = true;
  expect(resumeSetupStep(state, null, true)).toBe(1);
  expect(resumeSetupStep(state, { ...progress, step: 3 }, true)).toBe(3);
});

test('saving the first check-in keeps setup available until the summary is finished', () => {
  const state = { ...defaultWizardState(), checkins: [record] };
  expect(needsSetup(state, progress)).toBe(true);
  expect(needsSetup(state, { ...progress, status: 'complete', step: 8 })).toBe(false);
  expect(needsSetup(state, null)).toBe(false);
});

test('a completed setup stays complete even if the user later removes all check-ins', () => {
  expect(needsSetup(defaultWizardState(), { ...progress, status: 'complete', step: 8 })).toBe(false);
});

test('going back to check-in opens its saved identity rather than creating a duplicate', () => {
  const second = { ...record, clientId: 'second-record' };
  const state = { ...defaultWizardState(), checkins: [record, second] };
  expect(setupRecord(state, { ...progress, checkinKey: setupCheckinKey(record) })).toBe(record);
  expect(setupRecord(state, progress)).toBeNull();
  expect(setupRecord({ ...state, checkins: [record] }, progress)).toBe(record);
});

test('the local bookmark validates stored data and contains no tracking answers', () => {
  expect(readSetupProgress({ ...progress, notes: 'private note', symptoms: ['Fatigue'] })).toEqual(progress);
  expect(readSetupProgress({ ...progress, step: 7 })).toBeNull();
  expect(readSetupProgress({ ...progress, version: 2 })).toBeNull();
  expect(readSetupProgress(null)).toBeNull();
});
