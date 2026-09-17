// Wizard state shape — mirrors the website portal's localStorage state
// (key: geniorx_consumer_portal_v1_split).

export type Dose = 'low' | 'med' | 'high';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface WizardMed {
  medId: string;
  dose: Dose;
  durationMonths: number;
}

/**
 * A 0-10 rating the user actually asserted, or null when the question was not
 * answered. `null` is NOT a low score — never render it as 0 and never average
 * it in. See `ratingOrNull` / `readBodySystems` in engine.ts.
 */
export type Rating = number | null;

/** Explicit three-way answer; null means the question was never answered. */
export type TriState = 'yes' | 'no' | 'unsure';

/** The seven body systems, in display order. Mirrored in script.blade.php. */
export const BODY_SYSTEM_KEYS = [
  'energy', 'mood', 'sleep', 'focus', 'digestive', 'circulation', 'immunity',
] as const;
export type BodySystemKey = (typeof BODY_SYSTEM_KEYS)[number];

/** Lifestyle sub-questions on the monthly check. Stable ids so copy can change. */
export const LIFESTYLE_KEYS = ['movement', 'hydration', 'sleep_routine'] as const;
export type LifestyleKey = (typeof LIFESTYLE_KEYS)[number];

export interface Wellbeing {
  energy: number;
  mood: number;
  sleep: number;
  focus: number;
  // Added in v3. Optional AND nullable: absent on every check-in written before
  // the release, null when the user was asked this week and skipped. The four
  // above stay required so existing call sites keep compiling.
  digestive?: Rating;
  circulation?: Rating;
  immunity?: Rating;
}

/**
 * The monthly treatment check. Absent on weeks it was not due, and on every
 * check-in written before v3.
 */
export interface CheckinCompletion {
  labs: TriState | null;
  labsDateISO?: string | null;
  prescriber: TriState | null;
  prescriberDateISO?: string | null;
  lifestyle: Partial<Record<LifestyleKey, TriState | null>>;
}

export type SymptomChange = 'Worse' | 'No change' | 'Slightly better' | 'Much better' | 'Not present';

export interface CheckinSymptomItem {
  symptom: string;
  change: SymptomChange;
  changeScore: number;
  severityNow?: number;
}

export interface WizardCheckin {
  dateISO: string;
  adherencePct: number;
  supplementsTaken: string[];
  /**
   * Snapshot of plan.recommendedSupplements AT SAVE TIME. Without it,
   * supplement sufficiency for a past week becomes uncomputable as soon as the
   * live plan changes. Absent on pre-v3 check-ins.
   */
  supplementsPlanned?: string[];
  /** The monthly treatment check, when it was due that week. */
  completion?: CheckinCompletion;
  symptoms: { items: CheckinSymptomItem[]; improvementScore?: number };
  wellbeing: Wellbeing;
  sideEffects: string[];
  notes: string;
}

export interface WizardPlan {
  started: boolean;
  startDate: string | null;
  recommendedSupplements: string[];
  routine: Routine;
}

export interface Routine {
  morning: string[];
  midday: string[];
  night: string[];
  notes: string[];
}

export interface WizardFeedback {
  dateISO: string;
  type: string;
  message: string;
  canContact: boolean;
  email: string;
}

export interface WizardState {
  step: number;
  account: { email: string; consent: boolean };
  profile: { age: string; gender: string; phone: string; pregnant: boolean; kidneyDisease: boolean; anticoagulants: boolean };
  meds: WizardMed[];
  symptoms: { selected: string[]; custom: string[]; severity: Severity };
  symptomOnlyMode: boolean;
  wellbeingBaseline: Wellbeing;
  plan: WizardPlan;
  checkins: WizardCheckin[];
  feedback: WizardFeedback[];
}

export const defaultWizardState = (): WizardState => ({
  step: 0,
  account: { email: '', consent: false },
  profile: { age: '', gender: '', phone: '', pregnant: false, kidneyDisease: false, anticoagulants: false },
  meds: [],
  symptoms: { selected: [], custom: [], severity: 'mild' },
  symptomOnlyMode: false,
  // Explicit nulls, not 5: the key must exist so the server's
  // array_replace_recursive can later write over it, and so a cleared
  // rating actually persists rather than resurrecting a stale number.
  wellbeingBaseline: { energy: 5, mood: 5, sleep: 5, focus: 5, digestive: null, circulation: null, immunity: null },
  plan: { started: false, startDate: null, recommendedSupplements: [], routine: { morning: [], midday: [], night: [], notes: [] } },
  checkins: [],
  feedback: [],
});
