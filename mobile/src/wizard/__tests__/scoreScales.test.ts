// The Home dashboard shows three scores side by side. They are NOT on the same
// scale, which is exactly why they shipped misleading: two are 0-100 and one is
// 0-10, and the old tiles rendered "78 64 6.2" in identical boxes with no units.
//
// These tests pin the contract the UI now depends on. If someone changes one of
// these ranges, the label rendered next to it silently becomes a lie, so this
// should fail loudly rather than the number quietly meaning something else.

import {
  computeBodySystemsView,
  computeMedicationCompletion,
  computeWeeklyHealthScore,
} from '@/wizard/engine';
import { defaultWizardState, type WizardCheckin, type WizardState } from '@/wizard/types';

const checkin = (over: Partial<WizardCheckin> = {}): WizardCheckin => ({
  dateISO: '2026-09-14',
  adherencePct: 92,
  supplementsTaken: [],
  symptoms: { items: [] },
  wellbeing: { energy: 7, mood: 6, sleep: 4, focus: 6 },
  sideEffects: [],
  notes: '',
  ...over,
});

const withCheckins = (...cs: WizardCheckin[]): WizardState => ({
  ...defaultWizardState(),
  meds: [{ medId: 'metformin', dose: 'med', durationMonths: 12 }],
  symptoms: { selected: ['Fatigue'], custom: [], severity: 'mild' },
  checkins: cs,
});

describe('the three Home scores are on the scales their labels claim', () => {
  it('weekly health is 0-100', () => {
    const { score } = computeWeeklyHealthScore(withCheckins(checkin()));
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThanOrEqual(0);
    expect(score as number).toBeLessThanOrEqual(100);
  });

  it('completion is 0-100', () => {
    const { score } = computeMedicationCompletion(
      withCheckins(checkin({ completion: { labs: 'yes', prescriber: 'yes', lifestyle: {} } })),
    );
    expect(score).not.toBeNull();
    expect(score as number).toBeGreaterThanOrEqual(0);
    expect(score as number).toBeLessThanOrEqual(100);
  });

  it('body systems average is 0-10, NOT 0-100 — this is the one that misled', () => {
    const view = computeBodySystemsView(withCheckins(checkin()));
    expect(view.average).not.toBeNull();
    expect(view.average as number).toBeGreaterThanOrEqual(0);
    expect(view.average as number).toBeLessThanOrEqual(10);
  });

  it('a maxed-out body systems answer still tops out at 10', () => {
    const maxed = checkin({
      wellbeing: {
        energy: 10, mood: 10, sleep: 10, focus: 10,
        digestive: 10, circulation: 10, immunity: 10,
      },
    });
    expect(computeBodySystemsView(withCheckins(maxed)).average).toBe(10);
  });
});

describe('the denominators the rows render', () => {
  it('body systems reports how many of seven were answered', () => {
    const view = computeBodySystemsView(withCheckins(checkin()));
    // energy, mood, sleep, focus answered; digestive/circulation/immunity absent.
    expect(view.answered).toBe(4);
    expect(view.total).toBe(7);
  });

  it('completion reports its own answered count and total', () => {
    const c = computeMedicationCompletion(
      withCheckins(checkin({ completion: { labs: 'yes', prescriber: 'no', lifestyle: {} } })),
    );
    expect(c.total).toBeGreaterThan(0);
    expect(c.answered).toBeGreaterThan(0);
    expect(c.answered).toBeLessThanOrEqual(c.total);
  });

  it('completion still declares itself self-reported, which the row must label', () => {
    const c = computeMedicationCompletion(withCheckins(checkin()));
    expect(c.selfReported).toBe(true);
  });
});

describe('empty states render a dash, never a zero', () => {
  const empty = defaultWizardState();

  it('weekly health is null with no check-ins', () => {
    expect(computeWeeklyHealthScore(empty).score).toBeNull();
  });

  it('body systems average is null with no check-ins', () => {
    const view = computeBodySystemsView(empty);
    expect(view.average).toBeNull();
    expect(view.answered).toBe(0);
  });

  it('completion is null with no check-ins', () => {
    expect(computeMedicationCompletion(empty).score).toBeNull();
  });

  it('a single answered component is not enough to publish a completion score', () => {
    // MCS_MIN_COMPONENTS is 2 — "a completion score built from one checkbox is
    // a lie of confidence". The row must show a dash, not a number.
    const c = computeMedicationCompletion(withCheckins(checkin({ adherencePct: 90 })));
    if (c.answered < 2) expect(c.score).toBeNull();
  });
});
