// GeneoRx Guided Wizard — data + types ported from the website portal
// (geneorx_portal_layout_cleaned_safe2.html). Educational only.

export type SourceQuality = 'High' | 'Moderate' | 'Preliminary' | 'Pending';

export interface MedClaim {
  nutrient: string;
  source_quality: SourceQuality;
  citations: string[];
  notes: string[];
}

export interface MedEntry {
  id: string;
  name: string;
  symptomChips: string[];
  claims: MedClaim[];
}

export const MED_DB: MedEntry[] = [
  {
    id: 'metformin',
    name: 'Metformin',
    symptomChips: ['Fatigue', 'Tingling hands/feet', 'Brain fog', 'Low mood', 'GI discomfort'],
    claims: [
      {
        nutrient: 'Vitamin B12',
        source_quality: 'High',
        citations: ['PMID:26900641'],
        notes: [
          'Long-term metformin is associated with B12 deficiency risk; consider monitoring if symptoms present.',
        ],
      },
    ],
  },
  {
    id: 'atorvastatin',
    name: 'Atorvastatin (statin)',
    symptomChips: ['Muscle aches', 'Fatigue', 'Brain fog', 'Sleep changes'],
    claims: [
      {
        nutrient: 'CoQ10',
        source_quality: 'Moderate',
        citations: ['PMID:26192349'],
        notes: [
          'Statins are associated with lower CoQ10 levels; symptom benefit from supplementation varies.',
        ],
      },
    ],
  },
  {
    id: 'omeprazole',
    name: 'Omeprazole (PPI)',
    symptomChips: ['GI discomfort', 'Fatigue', 'Dizziness', 'Muscle cramps', 'Brain fog'],
    claims: [
      {
        nutrient: 'Magnesium',
        source_quality: 'High',
        citations: ['PMID:22392879'],
        notes: [
          'Long-term PPI use has a hypomagnesemia safety signal; consider Mg evaluation if symptomatic.',
        ],
      },
      {
        nutrient: 'Vitamin B12',
        source_quality: 'Moderate',
        citations: ['PMCID:PMC4110863'],
        notes: ['Association depends on duration and population; labs help clarify.'],
      },
    ],
  },
  { id: 'semaglutide', name: 'Semaglutide (GLP-1)', symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue'], claims: [] },
  { id: 'tirzepatide', name: 'Tirzepatide (GIP/GLP-1)', symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue'], claims: [] },
  { id: 'liraglutide', name: 'Liraglutide (GLP-1)', symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue'], claims: [] },
  { id: 'dulaglutide', name: 'Dulaglutide (GLP-1)', symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue'], claims: [] },
  { id: 'lisinopril', name: 'Lisinopril (ACE inhibitor)', symptomChips: ['Dizziness', 'Fatigue'], claims: [] },
  { id: 'losartan', name: 'Losartan (ARB)', symptomChips: ['Dizziness', 'Fatigue'], claims: [] },
  { id: 'amlodipine', name: 'Amlodipine (CCB)', symptomChips: ['Swelling', 'Dizziness', 'Fatigue'], claims: [] },
  { id: 'metoprolol', name: 'Metoprolol (beta blocker)', symptomChips: ['Fatigue', 'Dizziness', 'Low energy'], claims: [] },
];

export const GENERIC_SYMPTOMS: string[] = [
  'Fatigue', 'Low energy', 'Brain fog', 'Poor focus', 'Mood changes', 'Sleep changes',
  'GI discomfort', 'Constipation', 'Dizziness', 'Headache', 'Muscle cramps', 'Tingling hands/feet',
  'Heart palpitations', 'Muscle aches', 'Swelling', 'Anxiety', 'Nausea',
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

export const STEP_LABELS = [
  'Account', 'Medications', 'Symptoms', 'Wellbeing', 'Results',
  'Check-in', 'Progress', 'Citations', 'Summary', 'Feedback',
] as const;

export const STEP_SUBS: Record<string, string> = {
  Account: 'Set basics + consent + safety flags.',
  Medications: 'Pick from list or search + add a custom medication.',
  Symptoms: 'Pick symptoms and severity.',
  Wellbeing: 'Set baseline for tracking improvement.',
  Results: 'Nutrient signals + recommendations + evidence.',
  'Check-in': 'Log symptom improvement + adherence + wellbeing.',
  Progress: 'Weekly health signal + snapshot for clinician.',
  Citations: 'All sources referenced in this session.',
  Summary: 'Your overall GeneoRx dashboard view.',
  Feedback: 'Send questions and feedback to GeneoRx.',
};
