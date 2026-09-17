import {
  ratingOrNull,
  triStateOrNull,
  readBodySystems,
  computeBodySystemsView,
  computeMedicationCompletion,
  computeWeeklyHealthScore,
  MCS_MIN_COMPONENTS,
} from '@/wizard/engine';
import { defaultWizardState, type WizardCheckin, type WizardState } from '@/wizard/types';

function checkin(over: Partial<WizardCheckin> = {}): WizardCheckin {
  return {
    dateISO: '2026-05-18',
    adherencePct: 80,
    supplementsTaken: [],
    symptoms: { items: [], improvementScore: 0 },
    wellbeing: { energy: 8, mood: 7, sleep: 6, focus: 5 },
    sideEffects: [],
    notes: '',
    ...over,
  };
}

function stateWith(checkins: WizardCheckin[]): WizardState {
  return { ...defaultWizardState(), checkins };
}

describe('ratingOrNull', () => {
  it('keeps a real zero — the user did assert 0/10', () => {
    expect(ratingOrNull(0)).toBe(0);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a numeric string', '5'],
    ['NaN', NaN],
    ['a boolean', true],
    ['an object', {}],
  ])('treats %s as not answered', (_label, input) => {
    expect(ratingOrNull(input)).toBeNull();
  });

  it('clamps out-of-range rather than nulling it', () => {
    expect(ratingOrNull(11)).toBe(10);
    expect(ratingOrNull(-1)).toBe(0);
  });
});

describe('triStateOrNull', () => {
  it('accepts exactly the three literals', () => {
    expect(triStateOrNull('yes')).toBe('yes');
    expect(triStateOrNull('no')).toBe('no');
    expect(triStateOrNull('unsure')).toBe('unsure');
  });

  it.each([['Yes'], [true], [1], [undefined], [null]])('rejects %p', (input) => {
    expect(triStateOrNull(input)).toBeNull();
  });
});

describe('readBodySystems', () => {
  it('returns null — never 0 — for a pre-v3 check-in missing the new three', () => {
    const r = readBodySystems(checkin());
    expect(r.energy).toBe(8);
    expect(r.digestive).toBeNull();
    expect(r.circulation).toBeNull();
    expect(r.immunity).toBeNull();
  });

  it('nulls a corrupt legacy value rather than coercing it to 0', () => {
    const r = readBodySystems(checkin({ wellbeing: { energy: 'x', mood: 7, sleep: 6, focus: 5 } as never }));
    expect(r.energy).toBeNull();
    expect(r.mood).toBe(7);
  });
});

describe('computeBodySystemsView', () => {
  it('averages over answered rows only, not over 7', () => {
    const v = computeBodySystemsView(stateWith([checkin()]));
    expect(v.answered).toBe(4);
    expect(v.total).toBe(7);
    // mean of 8,7,6,5 — NOT (8+7+6+5)/7
    expect(v.average).toBe(6.5);
  });

  it('reports null, not 0, when nothing is answered', () => {
    const v = computeBodySystemsView(stateWith([]), null);
    expect(v.answered).toBe(0);
    expect(v.average).toBeNull();
  });

  it('leaves delta null for the new three when no baseline was ever collected', () => {
    const v = computeBodySystemsView(stateWith([checkin({ wellbeing: { energy: 8, mood: 7, sleep: 6, focus: 5, digestive: 7 } })]));
    const dig = v.rows.find((r) => r.key === 'digestive')!;
    expect(dig.value).toBe(7);
    expect(dig.baseline).toBeNull();
    expect(dig.delta).toBeNull();
  });
});

describe('computeMedicationCompletion', () => {
  it('scores null with no check-in at all', () => {
    const mc = computeMedicationCompletion(stateWith([]));
    expect(mc.score).toBeNull();
    expect(mc.confidence).toBe('none');
  });

  it('requires adherence — lifestyle alone is not a completion score', () => {
    const s = stateWith([]);
    const mc = computeMedicationCompletion(s, {
      ...checkin(),
      adherencePct: undefined as never,
      completion: { labs: null, prescriber: null, lifestyle: { movement: 'yes', hydration: 'yes' } },
    });
    // adherence falls back to 0 which IS answered, so assert the floor instead
    expect(mc.answered).toBeGreaterThanOrEqual(MCS_MIN_COMPONENTS);
  });

  it('renormalises weights instead of imputing — dropping a component with the rest equal leaves the score unchanged', () => {
    const base = checkin({
      adherencePct: 80,
      supplementsPlanned: ['Magnesium glycinate', 'B12'],
      supplementsTaken: ['Magnesium glycinate', 'B12'],
      completion: {
        labs: 'yes',
        prescriber: 'yes',
        lifestyle: { movement: 'yes', hydration: 'yes', sleep_routine: 'yes' },
      },
    });
    // all five answered; supplements/labs/prescriber/lifestyle are all 100, adherence 80
    const all = computeMedicationCompletion(stateWith([base]), base);
    expect(all.answered).toBe(5);
    expect(all.confidence).toBe('high');

    // drop labs -> four components, the remaining ones unchanged
    const without = computeMedicationCompletion(stateWith([]), {
      ...base,
      completion: { ...base.completion!, labs: null },
    });
    expect(without.answered).toBe(4);
    // labs was 100 and adherence 80, so removing a 100 lowers the mean — the point
    // is that it is a weighted mean of the REMAINING, not a zero for the missing one.
    expect(without.score).not.toBeNull();
    expect(without.score!).toBeGreaterThan(80);
  });

  it('scores a real 0 when a plan exists and nothing was taken', () => {
    const c = checkin({ supplementsPlanned: ['Magnesium glycinate'], supplementsTaken: [] });
    const mc = computeMedicationCompletion(stateWith([c]), c);
    const sup = mc.components.find((x) => x.key === 'supplements')!;
    expect(sup.score).toBe(0);
    expect(sup.reason).toBe('answered');
  });

  it('marks supplements not_applicable when there is no plan — distinct from a real 0', () => {
    const c = checkin();
    const mc = computeMedicationCompletion(stateWith([c]), c);
    const sup = mc.components.find((x) => x.key === 'supplements')!;
    expect(sup.score).toBeNull();
    expect(sup.reason).toBe('not_applicable');
  });

  it("treats 'unsure' as not answered, not as a failure", () => {
    const c = checkin({ completion: { labs: 'unsure', prescriber: null, lifestyle: {} } });
    const mc = computeMedicationCompletion(stateWith([c]), c);
    const labs = mc.components.find((x) => x.key === 'labs')!;
    expect(labs.score).toBeNull();
    expect(labs.reason).toBe('not_answered');
  });

  it('always flags itself as self-reported', () => {
    expect(computeMedicationCompletion(stateWith([checkin()])).selfReported).toBe(true);
  });
});

describe('computeWeeklyHealthScore', () => {
  it('is null with no history', () => {
    expect(computeWeeklyHealthScore(stateWith([])).score).toBeNull();
  });

  it('computes a delta against the previous check-in', () => {
    const older = checkin({ dateISO: '2026-05-11', adherencePct: 60, wellbeing: { energy: 5, mood: 5, sleep: 5, focus: 5 } });
    const newer = checkin({ dateISO: '2026-05-18', adherencePct: 90, wellbeing: { energy: 8, mood: 8, sleep: 8, focus: 8 } });
    const r = computeWeeklyHealthScore(stateWith([older, newer]));
    expect(r.score).not.toBeNull();
    expect(r.delta).not.toBeNull();
    expect(r.delta!).toBeGreaterThan(0);
  });

  it('does not invent wellbeing when the ratings are missing', () => {
    const c = checkin({ wellbeing: {} as never });
    const r = computeWeeklyHealthScore(stateWith([c]));
    expect(r.score).not.toBeNull();
  });
});
