import type { MedDef } from './types';

/** Master catalog (extend with `customMedCatalog` in app state). */
export const BASE_MED_DB: MedDef[] = [
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
        notes: ['Statins are associated with lower CoQ10 levels; symptom benefit from supplementation varies.'],
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
        notes: ['Long-term PPI use has a hypomagnesemia safety signal; consider Mg evaluation if symptomatic.'],
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
