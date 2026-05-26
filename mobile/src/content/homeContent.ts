export type AboutCard = {
  num: string;
  icon: string;
  title: string;
  body: string;
  bullets: string[];
  extra?: string;
  summary?: boolean;
};

export type HowItWorksStep = {
  num: string;
  title: string;
  body: string;
};

export type DemoOption = {
  value: string;
  label: string;
};

export type DemoInsight = {
  insight: string;
  meaning: string;
  doctor: string;
};

export type Testimonial = {
  quote: string;
  initials: string;
  name: string;
  role: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const FEATURE_CHIPS = [
  'Personalized health patterns',
  'Medication and nutrient insights',
  'Doctor-ready summaries',
] as const;

export const ABOUT_CARDS: AboutCard[] = [
  {
    num: '01',
    icon: '🧬',
    title: 'What is GeneoRx?',
    body:
      "GeneoRx is your personal medication intelligence platform connecting medications, symptoms, and nutrient levels to help you understand what's really going on in your body — giving you a clearer picture of your health.",
    bullets: [],
  },
  {
    num: '02',
    icon: '⚙️',
    title: 'How does it work?',
    body: 'GeneoRx analyzes:',
    bullets: [
      'Your medications',
      'Your symptoms over time',
      'Known drug–nutrient interactions',
    ],
    extra:
      'As you check in regularly, it builds a personalized profile, spotting patterns and improving accuracy over time.',
  },
  {
    num: '03',
    icon: '💡',
    title: 'How does it help you?',
    body: '',
    bullets: [
      'Explains symptoms — possible links to medications or nutrient imbalances',
      'Finds root causes — what may be driving fatigue or brain fog',
      'Tracks progress — monitors changes over time',
      'Prepares you for doctor visits — a concise health summary',
    ],
  },
  {
    num: '04',
    icon: '✨',
    title: 'In short.',
    body:
      'GeneoRx helps you connect the dots between your medications, symptoms, and nutrition — so you can make smarter health decisions.',
    bullets: [],
    summary: true,
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    num: 'i',
    title: 'Add your medications or symptoms',
    body:
      'Tell GeneoRx what you take and how you feel. We support commonly prescribed medications and their known nutrient interactions.',
  },
  {
    num: 'ii',
    title: 'Log your check-ins',
    body:
      'Weekly check-ins build a personal profile that spots patterns over time, tracking energy, mood, sleep, and focus.',
  },
  {
    num: 'iii',
    title: 'Get your insight',
    body:
      'Receive a plain-language explanation of possible connections plus specific questions to bring to your doctor.',
  },
];

export const DEMO_MEDICATIONS: DemoOption[] = [
  { value: '', label: 'None or unsure' },
  { value: 'metformin', label: 'Metformin (for diabetes)' },
  { value: 'statin', label: 'Statin (for cholesterol)' },
  { value: 'ppi', label: 'Omeprazole or PPI (for acid reflux)' },
  { value: 'birthcontrol', label: 'Birth control or hormonal' },
  { value: 'antidepressant', label: 'Antidepressant or SSRI' },
];

export const DEMO_SYMPTOMS: DemoOption[] = [
  { value: '', label: 'Select a symptom' },
  { value: 'fatigue', label: 'Fatigue or low energy' },
  { value: 'brainfog', label: 'Brain fog or poor concentration' },
  { value: 'musclepain', label: 'Muscle pain or weakness' },
  { value: 'dizziness', label: 'Dizziness or lightheadedness' },
  { value: 'sleep', label: 'Sleep problems' },
  { value: 'digestive', label: 'Digestive issues' },
];

const DEMO_INSIGHTS: Record<string, DemoInsight> = {
  'metformin-fatigue': {
    insight: 'Fatigue selected in a long-term Metformin user.',
    meaning:
      'Metformin can reduce absorption of Vitamin B12 over time in some individuals. Fatigue, especially with tingling or mood changes, may sometimes relate to this pattern.',
    doctor:
      'Ask whether Vitamin B12 testing is appropriate, how long you have been on Metformin, and whether levels have been checked recently.',
  },
  'statin-musclepain': {
    insight: 'Muscle discomfort selected in a statin user.',
    meaning:
      'Statins can sometimes affect CoQ10 levels, which plays a role in muscle energy. Muscle symptoms in statin users are worth tracking and discussing with your prescriber.',
    doctor:
      'Discuss the timing of muscle symptoms relative to starting the statin, whether dose adjustment or CoQ10 support might be relevant.',
  },
  'ppi-fatigue': {
    insight: 'Fatigue selected in a proton pump inhibitor user.',
    meaning:
      'Long-term PPI use can sometimes be associated with lower magnesium and B12 levels. Both are linked to energy and overall wellbeing.',
    doctor:
      'Ask whether magnesium or B12 testing is appropriate, and review the duration and necessity of your PPI use.',
  },
  'ppi-digestive': {
    insight: 'Digestive issues selected in a PPI user.',
    meaning:
      'PPIs reduce stomach acid, which can sometimes affect digestion and gut microbiome balance.',
    doctor: 'Discuss whether your current PPI dose and duration are still appropriate.',
  },
  'antidepressant-sleep': {
    insight: 'Sleep problems selected in an antidepressant user.',
    meaning:
      'Some antidepressants can affect sleep architecture, particularly when starting or adjusting dose.',
    doctor:
      'Discuss the timing of sleep changes relative to your medication and whether dose timing might help.',
  },
  brainfog: {
    insight: 'Brain fog selected as a primary symptom.',
    meaning:
      'Brain fog can overlap with medication side effects, sleep disruption, nutrient gaps (B12, magnesium, iron), and stress.',
    doctor:
      'Discuss when it started, whether any medication or lifestyle changes happened around the same time, and whether basic nutrient screening would be useful.',
  },
  fatigue: {
    insight: 'Fatigue selected without a specific medication pattern.',
    meaning:
      'Fatigue is common and can relate to nutrition, sleep, stress, thyroid function, or other factors.',
    doctor:
      'Ask about nutrient testing (B12, iron, vitamin D), thyroid function, and recent lifestyle changes.',
  },
  default: {
    insight: 'A possible medication–symptom pattern has been detected.',
    meaning:
      'Tracking your symptoms over time helps clarify whether a medication, nutrient pattern, or other factor is contributing.',
    doctor:
      'Bring persistent symptoms, their timing, and your full medication list to your healthcare provider.',
  },
};

export function generateDemoInsight(medication: string, symptom: string): DemoInsight | null {
  if (!symptom) return null;

  const comboKey = `${medication}-${symptom}`;
  if (DEMO_INSIGHTS[comboKey]) return DEMO_INSIGHTS[comboKey];
  if (DEMO_INSIGHTS[symptom]) return DEMO_INSIGHTS[symptom];
  return DEMO_INSIGHTS.default;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I had been on Metformin for years and constantly felt drained. GeneoRx suggested I ask about B12 — turned out my levels were genuinely low. Game changer.',
    initials: 'SR',
    name: 'Sarah R.',
    role: 'Type 2 diabetes patient',
  },
  {
    quote:
      'The doctor summary feature alone is worth it. I walk into appointments organized for the first time in years.',
    initials: 'MK',
    name: 'Michael K.',
    role: 'Multiple medications',
  },
  {
    quote:
      'I finally have a clear picture of what is going on. The weekly check-ins are quick and the trends are eye-opening.',
    initials: 'JL',
    name: 'Jenna L.',
    role: 'Long-term PPI user',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is GeneoRx a substitute for medical advice?',
    answer:
      'No. GeneoRx is educational guidance only — it surfaces possible patterns from your medications and symptoms and prepares you to have better conversations with your doctor. It does not diagnose, treat, or replace professional medical care.',
  },
  {
    question: 'How does GeneoRx use my data?',
    answer:
      'Your data stays private. We use it solely to surface your personal insights and never sell or share it with third parties. Data is encrypted in transit and at rest. You can request deletion at any time.',
  },
  {
    question: 'Which medications are supported?',
    answer:
      'GeneoRx supports commonly prescribed medications with well-documented nutrient and symptom interactions, including Metformin, statins, PPIs, hormonal contraceptives, and SSRIs. We add new medications based on user demand and clinical evidence.',
  },
  {
    question: 'How often should I check in?',
    answer:
      'Weekly check-ins work best. They take less than two minutes and let GeneoRx build a meaningful profile of how you are feeling over time, which improves the accuracy of your insights.',
  },
];

export const FOOTER_TAGLINE =
  'Personal medication intelligence. Helping you connect the dots between medications, symptoms, and nutrition.';

export const LEGAL_URLS = {
  privacy: 'https://geneorx.com/legal/privacy',
  terms: 'https://geneorx.com/legal/terms',
  contact: 'mailto:info@geneorx.com',
} as const;
