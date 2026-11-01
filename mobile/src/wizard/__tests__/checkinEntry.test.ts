import { hasCheckinAnswers } from '../checkinEntry';
import { defaultWizardState, type WizardCheckin } from '../types';
import { adherenceFromDoses, adherenceFromEstimate } from '../checkinEntry';

describe('check-in adherence entry', () => {
  it('calculates from the actual scheduled and missed doses', () => {
    expect(adherenceFromDoses('7', '1')).toBe(86);
    expect(adherenceFromDoses('14', '2')).toBe(86);
    expect(adherenceFromDoses('7', '0')).toBe(100);
    expect(adherenceFromDoses('7', '7')).toBe(0);
  });
  it.each([['', '0'], ['7', ''], ['0', '0'], ['7', '8'], ['-1', '0'], ['7.5', '1'], ['7', '-1']])('does not invent adherence for invalid counts %s / %s', (scheduled, missed) => {
    expect(adherenceFromDoses(scheduled, missed)).toBeNull();
  });
  it('keeps an explicit percentage option without treating blank as zero', () => {
    expect(adherenceFromEstimate('')).toBeNull();
    expect(adherenceFromEstimate('101')).toBeNull();
    expect(adherenceFromEstimate('1.5')).toBeNull();
    expect(adherenceFromEstimate('0')).toBe(0);
    expect(adherenceFromEstimate('86')).toBe(86);
    expect(adherenceFromEstimate('100')).toBe(100);
  });
});

const emptyUpdate = (): WizardCheckin => ({ dateISO: '2026-10-28', adherencePct: null, supplementsTaken: [], symptoms: { items: [] }, wellbeing: defaultWizardState().wellbeingBaseline, notes: '', sideEffects: [] });
test('a blank check-in does not create a misleading saved update', () => {
  expect(hasCheckinAnswers(emptyUpdate())).toBe(false);
  expect(hasCheckinAnswers({ ...emptyUpdate(), notes: '  ' })).toBe(false);
});
test('explicit uncertainty and a real zero are valid answers', () => {
  expect(hasCheckinAnswers({ ...emptyUpdate(), medicationDoses: [{ medId: 'a', medicationName: 'A', status: 'unsure' }] })).toBe(true);
  expect(hasCheckinAnswers({ ...emptyUpdate(), wellbeing: { ...emptyUpdate().wellbeing, energy: 0 } })).toBe(true);
  expect(hasCheckinAnswers({ ...emptyUpdate(), notes: 'Feeling well' })).toBe(true);
  expect(hasCheckinAnswers({ ...emptyUpdate(), completion: { labs: 'unsure', prescriber: null, lifestyle: {} } })).toBe(true);
});
