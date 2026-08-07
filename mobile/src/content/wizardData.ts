// GeneoRx Guided Wizard — data + types ported from the website portal
// (geneorx_portal_layout_cleaned_safe2.html). Educational only.

export type SourceQuality = 'High' | 'Moderate' | 'Low' | 'Preliminary' | 'Pending';

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
  /** Brand names / common spellings, so search matches what's on the box. */
  aliases?: string[];
}

// Full 20-medication set — mirrors database/seeders/MedicationSeeder.php exactly,
// so results match the website even before the live API catalog has loaded
// (MedCatalogContext falls back to this list, then merges in the API response).
export const MED_DB: MedEntry[] = [
  {
    id: 'metformin',
    name: 'Metformin',
    symptomChips: ['Fatigue', 'Tingling hands/feet', 'Brain fog', 'Low mood', 'GI discomfort'],
    aliases: ['Glucophage', 'Glumetza', 'Fortamet', 'Riomet', 'Diabex', 'Metfor', 'Siofor'],
    claims: [
      { nutrient: 'Vitamin B12', source_quality: 'High', citations: ['PMID:26900641'],
        notes: ['Long-term metformin is associated with B12 deficiency risk; consider monitoring if symptoms present.'] },
    ],
  },
  {
    id: 'atorvastatin',
    name: 'Atorvastatin (statin)',
    symptomChips: ['Muscle aches', 'Fatigue', 'Brain fog', 'Sleep changes'],
    aliases: ['Lipitor', 'Atorlip', 'Sortis', 'Torvast'],
    claims: [
      { nutrient: 'CoQ10', source_quality: 'Moderate', citations: ['PMID:26192349'],
        notes: ['Statins are associated with lower CoQ10 levels; symptom benefit from supplementation varies.'] },
    ],
  },
  {
    id: 'rosuvastatin',
    name: 'Rosuvastatin (statin)',
    symptomChips: ['Muscle aches', 'Fatigue', 'Brain fog', 'Sleep changes'],
    aliases: ['Crestor', 'Rosulip', 'Ezallor'],
    claims: [
      { nutrient: 'CoQ10', source_quality: 'Moderate', citations: ['PMID:26192349'],
        notes: ['Statins inhibit CoQ10 synthesis via the mevalonate pathway; monitoring is reasonable with myopathy symptoms.'] },
    ],
  },
  {
    id: 'simvastatin',
    name: 'Simvastatin (statin)',
    symptomChips: ['Muscle aches', 'Fatigue', 'Brain fog', 'Sleep changes'],
    aliases: ['Zocor', 'Simvacor', 'Simlup'],
    claims: [
      { nutrient: 'CoQ10', source_quality: 'Moderate', citations: ['PMID:26192349'],
        notes: ['Higher-potency statin; CoQ10 depletion via mevalonate pathway.'] },
    ],
  },
  {
    id: 'omeprazole',
    name: 'Omeprazole (PPI)',
    symptomChips: ['GI discomfort', 'Fatigue', 'Dizziness', 'Muscle cramps', 'Brain fog'],
    aliases: ['Prilosec', 'Losec', 'Omez', 'Zegerid'],
    claims: [
      { nutrient: 'Magnesium', source_quality: 'High', citations: ['PMID:22392879'],
        notes: ['Long-term PPI use has a hypomagnesemia safety signal; consider Mg evaluation if symptomatic.'] },
      { nutrient: 'Vitamin B12', source_quality: 'Moderate', citations: ['PMCID:PMC4110863'],
        notes: ['Reduced gastric acid may impair B12 absorption over time.'] },
    ],
  },
  {
    id: 'pantoprazole',
    name: 'Pantoprazole (PPI)',
    symptomChips: ['GI discomfort', 'Fatigue', 'Dizziness', 'Muscle cramps'],
    aliases: ['Protonix', 'Pantoloc', 'Controloc', 'Pantocid'],
    claims: [
      { nutrient: 'Magnesium', source_quality: 'High', citations: ['PMID:22392879'],
        notes: ['Class effect: long-term PPI use reduces gastric acid needed for Mg absorption.'] },
      { nutrient: 'Vitamin B12', source_quality: 'Moderate', citations: ['PMCID:PMC4110863'],
        notes: ['Reduced gastric acid may impair B12 release from dietary protein over time.'] },
    ],
  },
  {
    id: 'semaglutide',
    name: 'Semaglutide (GLP-1)',
    symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue', 'Hair loss'],
    aliases: ['Ozempic', 'Wegovy', 'Rybelsus'],
    claims: [
      { nutrient: 'Vitamin D', source_quality: 'Moderate', citations: ['PMID:37596620'],
        notes: ['Significant weight loss alters Vitamin D distribution.'] },
      { nutrient: 'Zinc', source_quality: 'Low', citations: ['PMID:35970808'],
        notes: ['Reduced caloric intake may affect zinc status.'] },
      { nutrient: 'Vitamin B12', source_quality: 'Low', citations: ['PMID:36941988'],
        notes: ['Slowed gastric motility may impair B12 absorption.'] },
    ],
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide (GIP/GLP-1)',
    symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue', 'Hair loss'],
    aliases: ['Mounjaro', 'Zepbound'],
    claims: [
      { nutrient: 'Vitamin D', source_quality: 'Moderate', citations: ['PMID:37596620'],
        notes: ['Rapid weight loss can alter fat-soluble vitamin distribution.'] },
      { nutrient: 'Zinc', source_quality: 'Low', citations: ['PMID:35970808'],
        notes: ['Reduced food intake may decrease dietary zinc.'] },
      { nutrient: 'Vitamin B12', source_quality: 'Low', citations: ['PMID:36941988'],
        notes: ['GI motility changes may reduce B12 absorption.'] },
    ],
  },
  {
    id: 'liraglutide',
    name: 'Liraglutide (GLP-1)',
    symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue'],
    aliases: ['Victoza', 'Saxenda'],
    claims: [
      { nutrient: 'Vitamin D', source_quality: 'Moderate', citations: ['PMID:37596620'],
        notes: ['Weight loss affects fat-soluble vitamin status.'] },
      { nutrient: 'Zinc', source_quality: 'Low', citations: ['PMID:35970808'],
        notes: ['Appetite suppression may lower zinc intake.'] },
    ],
  },
  {
    id: 'dulaglutide',
    name: 'Dulaglutide (GLP-1)',
    symptomChips: ['GI discomfort', 'Nausea', 'Constipation', 'Fatigue'],
    aliases: ['Trulicity'],
    claims: [
      { nutrient: 'Vitamin D', source_quality: 'Moderate', citations: ['PMID:37596620'],
        notes: ['GLP-1 class effect on fat-soluble vitamins.'] },
      { nutrient: 'Vitamin B12', source_quality: 'Low', citations: ['PMID:36941988'],
        notes: ['Reduced intake may modestly impact B12.'] },
    ],
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril (ACE inhibitor)',
    symptomChips: ['Dizziness', 'Fatigue', 'Muscle cramps'],
    aliases: ['Zestril', 'Prinivil', 'Lisodur'],
    claims: [
      { nutrient: 'Zinc', source_quality: 'Moderate', citations: ['PMID:9550460'],
        notes: ['ACE inhibitors contain zinc-binding moieties; long-term use may reduce serum zinc.'] },
    ],
  },
  {
    id: 'enalapril',
    name: 'Enalapril (ACE inhibitor)',
    symptomChips: ['Dizziness', 'Fatigue', 'Muscle cramps'],
    aliases: ['Vasotec', 'Renitec', 'Enalapril Maleate'],
    claims: [
      { nutrient: 'Zinc', source_quality: 'Moderate', citations: ['PMID:9550460'],
        notes: ['ACE inhibitors have zinc-chelating properties.'] },
    ],
  },
  {
    id: 'losartan',
    name: 'Losartan (ARB)',
    symptomChips: ['Dizziness', 'Fatigue', 'Muscle cramps'],
    aliases: ['Cozaar', 'Losacar', 'Hyzaar'],
    claims: [
      { nutrient: 'Zinc', source_quality: 'Low', citations: ['PMID:9550460'],
        notes: ['ARBs may share a modest zinc-lowering class effect.'] },
    ],
  },
  {
    id: 'amlodipine',
    name: 'Amlodipine (CCB)',
    symptomChips: ['Swelling', 'Dizziness', 'Fatigue'],
    aliases: ['Norvasc', 'Amlong', 'Istin', 'Katerzia'],
    claims: [
      { nutrient: 'CoQ10', source_quality: 'Low', citations: ['PMID:15003176'],
        notes: ['Observational data suggest cardiovascular medications may be associated with lower CoQ10.'] },
    ],
  },
  {
    id: 'metoprolol',
    name: 'Metoprolol (beta blocker)',
    symptomChips: ['Fatigue', 'Dizziness', 'Low energy', 'Sleep changes'],
    aliases: ['Lopressor', 'Toprol', 'Toprol-XL', 'Betaloc', 'Seloken'],
    claims: [
      { nutrient: 'CoQ10', source_quality: 'Low', citations: ['PMID:15003176'],
        notes: ['Beta-blockers observed to reduce CoQ10 in some heart failure patients.'] },
      { nutrient: 'Melatonin', source_quality: 'Low', citations: ['PMID:9590511'],
        notes: ['Metoprolol may suppress melatonin synthesis, contributing to sleep disturbances.'] },
    ],
  },
  {
    id: 'levothyroxine',
    name: 'Levothyroxine (thyroid)',
    symptomChips: ['Fatigue', 'Brain fog', 'Muscle aches', 'Dizziness', 'Hair loss', 'Low energy'],
    aliases: ['Synthroid', 'Euthyrox', 'Levoxyl', 'Eltroxin', 'Thyronorm', 'Unithroid'],
    claims: [
      { nutrient: 'Selenium', source_quality: 'Moderate', citations: ['PMID:28642112'],
        notes: ['Selenium is required for T4→T3 conversion.'] },
      { nutrient: 'Iron', source_quality: 'Moderate', citations: ['PMID:16001874'],
        notes: ['Iron deficiency can blunt levothyroxine response.'] },
      { nutrient: 'Zinc', source_quality: 'Moderate', citations: ['PMID:24861516'],
        notes: ['Zinc is involved in thyroid hormone metabolism.'] },
    ],
  },
  {
    id: 'furosemide',
    name: 'Furosemide (loop diuretic)',
    symptomChips: ['Muscle cramps', 'Dizziness', 'Fatigue', 'Heart palpitations', 'Low energy'],
    aliases: ['Lasix', 'Frusemide', 'Frusol'],
    claims: [
      { nutrient: 'Potassium', source_quality: 'High', citations: ['PMID:17536977'],
        notes: ['Loop diuretics cause significant urinary potassium wasting.'] },
      { nutrient: 'Magnesium', source_quality: 'High', citations: ['PMID:17536977'],
        notes: ['Furosemide increases urinary magnesium excretion.'] },
      { nutrient: 'Calcium', source_quality: 'Moderate', citations: ['PMID:17536977'],
        notes: ['Loop diuretics increase urinary calcium excretion.'] },
      { nutrient: 'B vitamins', source_quality: 'Low', citations: ['PMID:22716193'],
        notes: ['Chronic use may lower B1 (thiamine) levels.'] },
    ],
  },
  {
    id: 'hydrochlorothiazide',
    name: 'Hydrochlorothiazide (HCTZ)',
    symptomChips: ['Muscle cramps', 'Dizziness', 'Fatigue', 'Heart palpitations'],
    aliases: ['Microzide', 'HCTZ', 'Esidrix', 'Hydrodiuril'],
    claims: [
      { nutrient: 'Potassium', source_quality: 'High', citations: ['PMID:17536977'],
        notes: ['Thiazide diuretics cause potassium wasting.'] },
      { nutrient: 'Magnesium', source_quality: 'High', citations: ['PMID:17536977'],
        notes: ['Thiazides increase renal magnesium excretion.'] },
      { nutrient: 'Zinc', source_quality: 'Moderate', citations: ['PMID:9550460'],
        notes: ['Thiazide diuretics may increase urinary zinc loss.'] },
    ],
  },
  {
    id: 'spironolactone',
    name: 'Spironolactone (K-sparing diuretic)',
    symptomChips: ['Dizziness', 'Fatigue', 'Muscle cramps'],
    aliases: ['Aldactone', 'CaroSpir', 'Spiractin'],
    claims: [
      { nutrient: 'Potassium', source_quality: 'High', citations: ['PMID:17536977'],
        notes: ['Spironolactone retains potassium; hyperkalemia monitoring required.'] },
      { nutrient: 'Magnesium', source_quality: 'Moderate', citations: ['PMID:17536977'],
        notes: ['Potassium-sparing diuretics also conserve magnesium.'] },
    ],
  },
  {
    id: 'warfarin',
    name: 'Warfarin (anticoagulant)',
    symptomChips: ['Fatigue', 'Dizziness', 'Brain fog'],
    aliases: ['Coumadin', 'Jantoven', 'Marevan'],
    claims: [
      { nutrient: 'Vitamin K', source_quality: 'High', citations: ['PMID:25851918'],
        notes: ['Warfarin blocks Vitamin K recycling. Consistent Vitamin K intake is key — abrupt changes alter INR.'] },
    ],
  },
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

/** Steps hidden from the tray — mirrors the website portal. */
export const HIDDEN_STEPS = new Set([7, 9]);

export function visibleSteps(isGuest: boolean): number[] {
  const steps: number[] = [];
  for (let i = 0; i < STEP_LABELS.length; i++) {
    if (HIDDEN_STEPS.has(i)) continue;
    if (i === 0 && !isGuest) continue;
    steps.push(i);
  }
  return steps;
}

export function normalizeStep(n: number, isGuest: boolean): number {
  const v = visibleSteps(isGuest);
  if (v.includes(n)) return n;
  return v.find((s) => s >= n) ?? v[0] ?? 1;
}

export function nextVisibleStep(n: number, isGuest: boolean): number {
  const v = visibleSteps(isGuest);
  const i = v.indexOf(n);
  return i >= 0 && i < v.length - 1 ? v[i + 1] : n;
}

export function prevVisibleStep(n: number, isGuest: boolean): number {
  const v = visibleSteps(isGuest);
  const i = v.indexOf(n);
  return i > 0 ? v[i - 1] : n;
}
