// Wizard state shape — mirrors the website portal's localStorage state
// (key: geniorx_consumer_portal_v1_split).

export type Dose = 'low' | 'med' | 'high';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface WizardMed {
  medId: string;
  dose: Dose;
  durationMonths: number;
}

export interface Wellbeing {
  energy: number;
  mood: number;
  sleep: number;
  focus: number;
}

export type SymptomChange = 'Worse' | 'No change' | 'Slightly better' | 'Much better' | 'Not present';

export interface CheckinSymptomItem {
  symptom: string;
  change: SymptomChange;
  changeScore: number;
}

export interface WizardCheckin {
  dateISO: string;
  adherencePct: number;
  supplementsTaken: string[];
  symptoms: { items: CheckinSymptomItem[] };
  wellbeing: Wellbeing;
  sideEffects: string;
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
  profile: { age: string; gender: string; pregnant: boolean; kidneyDisease: boolean; anticoagulants: boolean };
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
  profile: { age: '', gender: '', pregnant: false, kidneyDisease: false, anticoagulants: false },
  meds: [],
  symptoms: { selected: [], custom: [], severity: 'mild' },
  symptomOnlyMode: false,
  wellbeingBaseline: { energy: 5, mood: 5, sleep: 5, focus: 5 },
  plan: { started: false, startDate: null, recommendedSupplements: [], routine: { morning: [], midday: [], night: [], notes: [] } },
  checkins: [],
  feedback: [],
});
