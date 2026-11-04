// Wizard state shape — mirrors the website portal's localStorage state
// (key: geniorx_consumer_portal_v1_split).

export type Dose = 'low' | 'med' | 'high' | 'unknown';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface WizardMed {
  medId: string;
  dose: Dose;
  durationMonths: number;
  strength?: string;
  frequency?: string;
  startDate?: string;
  modelInputsConfirmed?: boolean;
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
  /** Optional context captured alongside the baseline ratings. */
  notes?: string;
  energy: Rating;
  mood: Rating;
  sleep: Rating;
  focus: Rating;
  // Added in v3. Optional AND nullable: absent on every check-in written before
  // the release, null when the user was asked this week and skipped. The four
  // above also accept null so a skipped check-in never invents a rating.
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
  change: SymptomChange | 'Not answered';
  changeScore: number;
  severityNow?: number;
}

export interface SymptomDetail { onsetDate?: string; severity?: Severity; notes?: string }
export interface MedicationDoseEntry {
  medId: string;
  medicationName: string;
  status: 'all' | 'some' | 'unsure' | 'not-scheduled';
  scheduled?: number;
  missed?: number;
  strength?: string;
  frequency?: string;
}
export interface WizardCheckin {
  clientId?: string;
  id?: number;
  dateISO: string;
  adherencePct: number | null;
  medicationDoses?: MedicationDoseEntry[];
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
  account: { email: string; consent: boolean; aiConsent: boolean };
  profile: { age: string; gender: string; phone: string; pregnant: boolean; kidneyDisease: boolean; anticoagulants: boolean };
  meds: WizardMed[];
  symptoms: { selected: string[]; custom: string[]; severity: Severity; details?: Record<string, SymptomDetail> };
  symptomOnlyMode: boolean;
  wellbeingBaseline: Wellbeing;
  plan: WizardPlan;
  checkins: WizardCheckin[];
  feedback: WizardFeedback[];
  summaryOverview?: Partial<Record<'7' | '30' | 'all', string>>;
  summaryOverviewBasis?: Partial<Record<'7' | '30' | 'all', string>>;
  reminderPreferences?: { enabled: boolean };
}

export const defaultWizardState = (): WizardState => ({
  step: 0,
  account: { email: '', consent: false, aiConsent: false },
  profile: { age: '', gender: '', phone: '', pregnant: false, kidneyDisease: false, anticoagulants: false },
  meds: [],
  symptoms: { selected: [], custom: [], severity: 'mild', details: {} },
  symptomOnlyMode: false,
  // Explicit nulls, not 5: the key must exist so the server's
  // array_replace_recursive can later write over it, and so a cleared
  // rating actually persists rather than resurrecting a stale number.
  wellbeingBaseline: { energy: null, mood: null, sleep: null, focus: null, digestive: null, circulation: null, immunity: null },
  plan: { started: false, startDate: null, recommendedSupplements: [], routine: { morning: [], midday: [], night: [], notes: [] } },
  checkins: [],
  feedback: [],
});
