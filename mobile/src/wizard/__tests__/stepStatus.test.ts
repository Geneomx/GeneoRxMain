import {
  isCheckinDue,
  isSetupComplete,
  isSetupStep,
  setupDigest,
  stepLockReason,
  stepStateOf,
  stepSummary,
} from '@/wizard/stepStatus';
import { defaultWizardState, type WizardCheckin, type WizardState } from '@/wizard/types';

/** Echoes the key plus its vars, so assertions can see what was interpolated. */
const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${Object.values(vars).join(',')}` : key;

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const checkin = (dateISO: string): WizardCheckin => ({
  dateISO,
  adherencePct: 80,
  supplementsTaken: [],
  symptoms: { items: [] },
  wellbeing: { energy: 5, mood: 5, sleep: 5, focus: 5 },
  sideEffects: [],
  notes: '',
});

const withSetup = (over: Partial<WizardState> = {}): WizardState => ({
  ...defaultWizardState(),
  meds: [{ medId: 'metformin', dose: 'med', durationMonths: 12 }],
  symptoms: { selected: ['Fatigue', 'Brain fog'], custom: [], severity: 'mild' },
  ...over,
});

describe('setup folding', () => {
  it('treats steps 0-4 as setup and nothing else', () => {
    expect([0, 1, 2, 3, 4].every(isSetupStep)).toBe(true);
    expect([5, 6, 7, 8, 9].some(isSetupStep)).toBe(false);
  });

  it('does not fold a first-run user, whose only task is inside setup', () => {
    expect(isSetupComplete(defaultWizardState())).toBe(false);
  });

  it('needs both medications and symptoms before folding', () => {
    const medsOnly = { ...defaultWizardState(), meds: [{ medId: 'metformin', dose: 'med' as const, durationMonths: 6 }] };
    expect(isSetupComplete(medsOnly)).toBe(false);
    expect(isSetupComplete(withSetup())).toBe(true);
  });

  it('counts symptom-only mode as having medications', () => {
    const s = {
      ...defaultWizardState(),
      symptomOnlyMode: true,
      symptoms: { selected: ['Fatigue'], custom: [], severity: 'mild' as const },
    };
    expect(isSetupComplete(s)).toBe(true);
  });

  it('carries every folded value into the digest, losing nothing', () => {
    const digest = setupDigest(withSetup(), t);
    expect(digest).toContain('step.sum.meds_one:1');
    expect(digest).toContain('step.sum.symptoms:2');
    expect(digest).toContain('step.sum.baseline');
  });
});

describe('lock labels', () => {
  it('locks Results only when there is nothing to compute from', () => {
    expect(stepLockReason(defaultWizardState(), 4, t)).toBe('step.lock.needsMed');
    expect(stepLockReason(withSetup(), 4, t)).toBeNull();
  });

  it('treats symptom-only mode as a supported path, not a missing prerequisite', () => {
    const s = { ...defaultWizardState(), symptomOnlyMode: true };
    expect(stepLockReason(s, 4, t)).toBeNull();
  });

  it('locks Progress and Insights until one check-in exists', () => {
    const empty = withSetup();
    expect(stepLockReason(empty, 6, t)).toBe('step.lock.needsCheckin');
    expect(stepLockReason(empty, 7, t)).toBe('step.lock.needsCheckin');

    const logged = withSetup({ checkins: [checkin(daysAgo(1))] });
    expect(stepLockReason(logged, 6, t)).toBeNull();
    expect(stepLockReason(logged, 7, t)).toBeNull();
  });

  it('never locks a step that would render fine — Summary and Check-in stay open', () => {
    const s = defaultWizardState();
    expect(stepLockReason(s, 5, t)).toBeNull();
    expect(stepLockReason(s, 8, t)).toBeNull();
  });
});

describe('step state', () => {
  it('marks the open step current, whatever else is true of it', () => {
    // Step 6 has no check-ins and would otherwise read as locked.
    expect(stepStateOf(withSetup(), 6, 6, t)).toBe('current');
  });

  it('separates locked from merely not-current', () => {
    const logged = withSetup({ checkins: [checkin(daysAgo(1))] });
    expect(stepStateOf(logged, 6, 5, t)).toBe('available');
    expect(stepStateOf(withSetup(), 6, 5, t)).toBe('locked');
  });

  it('marks answered setup steps done', () => {
    const s = withSetup();
    expect(stepStateOf(s, 1, 5, t)).toBe('done');
    expect(stepStateOf(s, 2, 5, t)).toBe('done');
  });

  it('shows Check-in as done this week and available once it is due again', () => {
    expect(stepStateOf(withSetup({ checkins: [checkin(daysAgo(1))] }), 5, 1, t)).toBe('done');
    expect(stepStateOf(withSetup({ checkins: [checkin(daysAgo(9))] }), 5, 1, t)).toBe('available');
  });
});

describe('row values', () => {
  it('counts medications and symptoms', () => {
    const s = withSetup();
    expect(stepSummary(s, 1, t)).toBe('step.sum.meds_one:1');
    expect(stepSummary(s, 2, t)).toBe('step.sum.symptoms:2');
  });

  it('returns null rather than a zero when a step is empty', () => {
    const s = defaultWizardState();
    // The row renders a dash for null. A "0 tracked" would read as a real
    // answer of none, which is not what an untouched step means.
    expect(stepSummary(s, 1, t)).toBeNull();
    expect(stepSummary(s, 2, t)).toBeNull();
    expect(stepSummary(s, 6, t)).toBeNull();
    expect(stepSummary(s, 7, t)).toBeNull();
  });

  it('says Due now when the week has lapsed and Logged when it has not', () => {
    expect(stepSummary(withSetup({ checkins: [checkin(daysAgo(1))] }), 5, t)).toBe('step.sum.logged');
    expect(stepSummary(withSetup({ checkins: [checkin(daysAgo(9))] }), 5, t)).toBe('step.sum.due');
  });

  it('says Due now rather than a dash for someone who has never checked in', () => {
    expect(stepSummary(withSetup(), 5, t)).toBe('step.sum.due');
  });

  it('says the baseline is saved in words, never as a run of digits', () => {
    const s = withSetup();
    s.wellbeingBaseline = { energy: 7, mood: 6, sleep: 4, focus: 5, digestive: null, circulation: null, immunity: null };
    // "Baseline 7·6·4·5" is unreadable for the older adults who mostly use this.
    expect(stepSummary(s, 3, t)).toBe('step.sum.baseline');
  });

  it('uses a singular label for one, so no row ever reads "1 weeks"', () => {
    const one = withSetup({ checkins: [checkin(daysAgo(1))] });
    expect(stepSummary(one, 6, t)).toBe('step.sum.weeks_one:1');
  });

  it('counts weeks from the check-in history', () => {
    const s = withSetup({ checkins: [checkin(daysAgo(14)), checkin(daysAgo(7)), checkin(daysAgo(1))] });
    expect(stepSummary(s, 6, t)).toBe('step.sum.weeks:3');
  });

  it('reports the real nutrient signal count for Results', () => {
    // Metformin claims Vitamin B12 in MED_DB, so exactly one signal.
    expect(stepSummary(withSetup(), 4, t)).toBe('step.sum.signals_one:1');
  });
});

describe('check-in cadence', () => {
  it('is due with no history at all', () => {
    expect(isCheckinDue(defaultWizardState())).toBe(true);
  });

  it('is not due the same week, and due again after seven days', () => {
    expect(isCheckinDue(withSetup({ checkins: [checkin(daysAgo(2))] }))).toBe(false);
    expect(isCheckinDue(withSetup({ checkins: [checkin(daysAgo(7))] }))).toBe(true);
  });
});
