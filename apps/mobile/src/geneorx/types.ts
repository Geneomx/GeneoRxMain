export type MedClaim = {
  nutrient: string;
  source_quality: 'High' | 'Moderate' | 'Preliminary' | string;
  citations?: string[];
  notes?: string | string[];
};

export type MedDef = {
  id: string;
  name: string;
  symptomChips: string[];
  claims: MedClaim[];
};

export type MedEntry = { medId: string; dose: string; durationMonths: number };

export type SymptomChange =
  | 'Worse'
  | 'No change'
  | 'Slightly better'
  | 'Much better'
  | 'Not present';

export type CheckinItem = {
  symptom: string;
  change: SymptomChange;
  changeScore: number;
  severityNow: number;
};

export type CheckinEntry = {
  dateISO: string;
  adherencePct: number;
  supplementsTaken: string[];
  wellbeing: { energy: number; mood: number; sleep: number; focus: number };
  symptoms: { items: CheckinItem[]; improvementScore: number };
  sideEffects: string[];
  notes: string;
};

export type FeedbackEntry = {
  dateISO: string;
  type: string;
  message: string;
  canContact: boolean;
  email: string;
};

export type SubscriptionState = {
  plan: 'free' | 'plus' | string;
  status: string;
  isPlus: boolean;
  isTrialing: boolean;
  isGrace: boolean;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  currentPeriodEndsAt?: string | null;
  canceledAt?: string | null;
  features: {
    maxFreeCheckins: number;
    doctorExport: boolean;
    pushReminderScheduling: boolean;
    advancedTrends: boolean;
    insightHistory: boolean;
  };
};

export type GeneoState = {
  step: number;
  account: { email: string; consent: boolean };
  profile: {
    age: string;
    gender: string;
    phone?: string;
    pregnant: boolean;
    kidneyDisease: boolean;
    anticoagulants: boolean;
  };
  meds: MedEntry[];
  symptoms: { selected: string[]; custom: string[]; severity: 'mild' | 'moderate' | 'severe' };
  symptomOnlyMode: boolean;
  wellbeingBaseline: { energy: number; mood: number; sleep: number; focus: number };
  plan: {
    started: boolean;
    startDate: string | null;
    recommendedSupplements: string[];
    routine: {
      morning?: string[];
      midday?: string[];
      night?: string[];
      notes?: string[];
    };
  };
  checkins: CheckinEntry[];
  feedback: FeedbackEntry[];
  customMedCatalog: MedDef[];
  reminderPreferences: {
    enabled: boolean;
    day: string;
    time: string;
    timezone: string;
  };
  subscription: SubscriptionState;
};

export const STEP_LABELS = [
  'Account',
  'Medications',
  'Symptoms',
  'Wellbeing',
  'Insights',
  'Check-in',
  'Progress',
  'Sources',
  'Doctor summary',
  'Feedback',
] as const;

export const GENERIC_SYMPTOMS = [
  'Fatigue',
  'Low energy',
  'Brain fog',
  'Poor focus',
  'Mood changes',
  'Sleep changes',
  'GI discomfort',
  'Constipation',
  'Dizziness',
  'Headache',
  'Muscle cramps',
  'Tingling hands/feet',
  'Heart palpitations',
  'Muscle aches',
  'Swelling',
  'Anxiety',
  'Nausea',
];

export const SUPPLEMENT_MAP: Record<string, string[]> = {
  CoQ10: ['CoQ10 (ubiquinol)'],
  'Vitamin D': ['Vitamin D3 (consider K2)'],
  'Vitamin B12': ['Methyl B12'],
  Magnesium: ['Magnesium glycinate'],
  Potassium: ['Electrolytes / potassium foods'],
  Calcium: ['Calcium + bone support'],
  'B vitamins': ['B-complex (methylated)'],
};

export const LAB_SUGGESTIONS: Record<string, string[]> = {
  'Vitamin B12': ['Vitamin B12', 'MMA (methylmalonic acid)', 'Homocysteine (optional)'],
  'Vitamin D': ['25(OH) Vitamin D'],
  Magnesium: ['Magnesium (serum)', 'RBC magnesium (if available)'],
  Potassium: ['BMP/CMP (electrolytes)'],
  Calcium: ['Calcium', 'Albumin', 'PTH (if abnormal)'],
  CoQ10: ['No standard routine lab; consider symptom tracking + clinician guidance'],
  'B vitamins': ['CBC', 'Homocysteine (optional)', 'B12 + Folate'],
};

export const IMPACT: SymptomChange[] = [
  'Worse',
  'No change',
  'Slightly better',
  'Much better',
  'Not present',
];

export const impactValue: Record<string, number> = {
  Worse: -2,
  'No change': 0,
  'Slightly better': 1,
  'Much better': 2,
  'Not present': 0,
};
