// GeneoRx scoring / evidence / insight engine — ported from the website portal.
// All functions are pure and take the wizard state as input.

import {
  MED_DB,
  GENERIC_SYMPTOMS,
  SUPPLEMENT_MAP,
  LAB_SUGGESTIONS,
  type MedClaim,
  type SourceQuality,
} from '@/content/wizardData';
import type { Dose, Routine, Severity, WizardCheckin, WizardState } from '@/wizard/types';

export type Tier = 'High' | 'Moderate' | 'Low';
export type AlertLevel = 'High' | 'Moderate' | 'Low';

/* ---------- util ---------- */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ---------- citations ---------- */
export function citationToLink(token: string): string {
  const t = String(token || '').trim();
  if (/^PMID:\d+$/i.test(t)) return `https://pubmed.ncbi.nlm.nih.gov/${t.split(':')[1]}/`;
  if (/^PMCID:PMC\d+$/i.test(t)) return `https://pmc.ncbi.nlm.nih.gov/articles/${t.split(':')[1].toUpperCase()}/`;
  return '';
}

/* ---------- scoring factors ---------- */
export function doseFactor(d: Dose): number {
  return d === 'low' ? 0.85 : d === 'high' ? 1.25 : 1.0;
}
export function durationFactor(months: number): number {
  const m = clamp(months || 0, 0, 24);
  return 0.55 + (m / 24) * 0.75;
}
export function severityFactor(sev: Severity): number {
  return sev === 'severe' ? 1.35 : sev === 'moderate' ? 1.15 : 1.0;
}
export function qualityWeight(q: SourceQuality): number {
  return q === 'High' ? 4 : q === 'Moderate' ? 3 : 2;
}
export function tierFromScore(score: number): Tier {
  if (score >= 70) return 'High';
  if (score >= 45) return 'Moderate';
  return 'Low';
}

export type NutrientScore = [string, number];

export function computeNutrientScores(s: WizardState): NutrientScore[] {
  const scores: Record<string, number> = {};
  const sevF = severityFactor(s.symptoms.severity);

  for (const mi of s.meds) {
    const med = MED_DB.find((x) => x.id === mi.medId);
    if (!med) continue;
    const f = doseFactor(mi.dose) * durationFactor(mi.durationMonths) * sevF;
    for (const cl of med.claims || []) {
      const w = qualityWeight(cl.source_quality) * 10 * f;
      scores[cl.nutrient] = (scores[cl.nutrient] || 0) + w;
    }
  }

  // symptom-only fallback
  if (Object.keys(scores).length === 0 && s.symptoms.selected.length) {
    const burden = s.symptoms.selected.length * 9 * sevF;
    scores.Magnesium = (scores.Magnesium || 0) + burden;
    scores['B vitamins'] = (scores['B vitamins'] || 0) + burden * 0.85;
    scores['Vitamin D'] = (scores['Vitamin D'] || 0) + burden * 0.6;
  }

  return (Object.entries(scores) as NutrientScore[])
    .map(([k, v]) => [k, clamp(Math.round(v), 0, 100)] as NutrientScore)
    .sort((a, b) => b[1] - a[1]);
}

export interface SupplementRec {
  nutrient: string;
  tier: Tier;
  supplement: string;
  score: number;
}

export function recommendSupplements(nutrientScores: NutrientScore[]): SupplementRec[] {
  const out: SupplementRec[] = [];
  for (const [nut, score] of nutrientScores.slice(0, 10)) {
    const tier = tierFromScore(score);
    const sups = SUPPLEMENT_MAP[nut] || [];
    for (const sup of sups) out.push({ nutrient: nut, tier, supplement: sup, score });
  }
  const rank: Record<Tier, number> = { High: 3, Moderate: 2, Low: 1 };
  const best = new Map<string, SupplementRec>();
  for (const item of out) {
    const prev = best.get(item.supplement);
    if (!prev || rank[item.tier] > rank[prev.tier]) best.set(item.supplement, item);
  }
  return [...best.values()]
    .sort((a, b) => (rank[b.tier] !== rank[a.tier] ? rank[b.tier] - rank[a.tier] : (b.score || 0) - (a.score || 0)))
    .slice(0, 10);
}

/* ---------- evidence ---------- */
export interface NutrientClaim extends MedClaim {
  medId: string;
  medName: string;
}

export function claimsForSelectedMeds(s: WizardState): NutrientClaim[] {
  const out: NutrientClaim[] = [];
  for (const mi of s.meds) {
    const med = MED_DB.find((x) => x.id === mi.medId);
    if (!med) continue;
    for (const cl of med.claims || []) out.push({ medId: med.id, medName: med.name, ...cl });
  }
  return out;
}

export function aggregateEvidenceByNutrient(claims: NutrientClaim[]): Record<string, NutrientClaim[]> {
  const map: Record<string, NutrientClaim[]> = {};
  for (const cl of claims) {
    if (!map[cl.nutrient]) map[cl.nutrient] = [];
    map[cl.nutrient].push(cl);
  }
  return map;
}

export function summarizeSourceQuality(claims: NutrientClaim[]): SourceQuality {
  const qs = (claims || []).map((c) => c.source_quality).filter(Boolean);
  if (qs.includes('High')) return 'High';
  if (qs.includes('Moderate')) return 'Moderate';
  if (qs.includes('Preliminary')) return 'Preliminary';
  return 'Pending';
}

export interface EvidencePanel {
  citations: string[];
  noteText: string;
  labs: string[];
}

export function evidencePanel(nutrient: string, claims: NutrientClaim[]): EvidencePanel {
  const labs = LAB_SUGGESTIONS[nutrient] || [];
  const seen = new Set<string>();
  const citations: string[] = [];
  const notes: string[] = [];
  for (const cl of claims || []) {
    (cl.citations || []).forEach((id) => {
      const key = String(id || '').trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      citations.push(key);
    });
    (cl.notes || []).forEach((n) => {
      if (n && String(n).trim()) notes.push(String(n).trim());
    });
  }
  return { citations: citations.slice(0, 6), noteText: uniq(notes).slice(0, 3).join(' '), labs };
}

export function evidenceCoverage(s: WizardState): { selectedCount: number; evidenceCount: number } {
  const selected = s.meds.map((m) => m.medId);
  const evidenceCount = selected.filter((id) => {
    const med = MED_DB.find((x) => x.id === id);
    return med && (med.claims || []).some((c) => (c.citations || []).length > 0);
  }).length;
  return { selectedCount: selected.length, evidenceCount };
}

export function buildCitationsRegistry(s: WizardState): { all: string[]; pmid: string[]; pmcid: string[]; other: string[] } {
  const claims = claimsForSelectedMeds(s);
  const seen = new Set<string>();
  const all: string[] = [];
  for (const cl of claims) {
    for (const id of cl.citations || []) {
      const tok = String(id || '').trim();
      if (!tok || seen.has(tok)) continue;
      seen.add(tok);
      all.push(tok);
    }
  }
  const pmid: string[] = [];
  const pmcid: string[] = [];
  const other: string[] = [];
  all.forEach((tok) => {
    if (/^PMID:\d+$/i.test(tok)) pmid.push(tok.toUpperCase());
    else if (/^PMCID:PMC\d+$/i.test(tok)) pmcid.push(tok.toUpperCase());
    else other.push(tok);
  });
  pmid.sort();
  pmcid.sort();
  other.sort();
  return { all, pmid, pmcid, other };
}

/* ---------- safety ---------- */
export function safetyFlags(s: WizardState): string[] {
  const p = s.profile || {};
  const flags: string[] = [];
  if (p.pregnant) flags.push('Pregnant/breastfeeding');
  if (p.kidneyDisease) flags.push('Kidney disease');
  if (p.anticoagulants) flags.push('Anticoagulants/blood thinners');
  return flags;
}

/* ---------- symptoms ---------- */
export function getSymptomUniverse(s: WizardState): string[] {
  const base = s.meds.length
    ? (() => {
        const chips: string[] = [];
        s.meds.forEach((mi) => {
          const med = MED_DB.find((x) => x.id === mi.medId);
          if (med) chips.push(...(med.symptomChips || []));
        });
        return uniq(chips).slice(0, 24);
      })()
    : GENERIC_SYMPTOMS.slice();
  return uniq([...(base || []), ...((s.symptoms && s.symptoms.custom) || [])]).slice(0, 40);
}

/* ---------- interactions / contraindications ---------- */
export interface AlertItem {
  title: string;
  level: AlertLevel;
  note: string;
  action: string;
}

export function computeDrugInteractions(s: WizardState): AlertItem[] {
  const ids = s.meds.map((m) => m.medId);
  const out: AlertItem[] = [];
  if (ids.includes('metformin') && ids.includes('omeprazole')) {
    out.push({
      title: 'Metformin + Omeprazole',
      level: 'Moderate',
      note: 'This combination may increase the chance that B12-related symptoms or magnesium-related symptoms are overlooked over time.',
      action: 'Discuss B12 / magnesium monitoring and symptom tracking with your clinician.',
    });
  }
  if (ids.includes('lisinopril') && ids.includes('losartan')) {
    out.push({
      title: 'Lisinopril + Losartan',
      level: 'High',
      note: 'Using an ACE inhibitor and ARB together can increase monitoring needs for kidney function and potassium.',
      action: 'Review this combination with your clinician unless it was specifically prescribed and monitored.',
    });
  }
  if (ids.includes('amlodipine') && ids.includes('metoprolol')) {
    out.push({
      title: 'Amlodipine + Metoprolol',
      level: 'Moderate',
      note: 'This combination may increase dizziness, low energy, or exercise intolerance in some users.',
      action: 'Track dizziness and blood pressure symptoms, especially after dose changes.',
    });
  }
  return out;
}

export function computeContraindications(s: WizardState): AlertItem[] {
  const ids = s.meds.map((m) => m.medId);
  const flags: AlertItem[] = [];
  if (s.profile.pregnant && (ids.includes('lisinopril') || ids.includes('losartan'))) {
    flags.push({
      title: 'Pregnancy caution with ACE inhibitor / ARB therapy',
      level: 'High',
      note: 'Lisinopril and losartan need clinician review if pregnancy is present or possible.',
      action: 'Contact your clinician promptly for medication review.',
    });
  }
  if (s.profile.kidneyDisease && (ids.includes('metformin') || ids.includes('lisinopril') || ids.includes('losartan'))) {
    flags.push({
      title: 'Kidney disease monitoring needed',
      level: 'High',
      note: 'This medication profile increases the importance of kidney function and electrolyte monitoring.',
      action: 'Do not add new supplements casually until renal status and labs are reviewed.',
    });
  }
  if (s.profile.anticoagulants && s.plan.recommendedSupplements.some((x) => String(x).toLowerCase().includes('coq10'))) {
    flags.push({
      title: 'Supplement review recommended with blood thinners',
      level: 'Moderate',
      note: 'Some supplements should be reviewed more carefully when anticoagulants are part of the profile.',
      action: 'Ask your clinician or pharmacist to review supplement safety and timing.',
    });
  }
  return flags;
}

/* ---------- predictions / patterns / insight ---------- */
export interface SuccessPrediction {
  score: number;
  level: 'Strong' | 'Moderate' | 'At risk';
  reason: string;
}

export function computeMedicationSuccessPrediction(s: WizardState): SuccessPrediction {
  let score = 50;
  if (s.plan.started) score += 10;
  if (s.checkins.length >= 2) score += 10;
  if (s.symptoms.severity === 'severe') score -= 15;
  if (s.symptoms.selected.length >= 4) score -= 10;
  score -= computeDrugInteractions(s).length * 8;
  score -= computeContraindications(s).length * 10;
  const last = latestCheckin(s);
  if (last) {
    if (last.adherencePct >= 80) score += 15;
    else if (last.adherencePct < 60) score -= 15;
  }
  score = clamp(score, 0, 100);
  const level: SuccessPrediction['level'] = score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'At risk';
  const reason =
    score >= 75
      ? 'Your current inputs suggest a better chance of staying consistent with this plan.'
      : score >= 50
        ? 'Your plan may work, but symptoms, complexity, or follow-through could reduce success.'
        : 'Your current symptom burden or safety complexity may make long-term success harder without closer support.';
  return { score, level, reason };
}

export interface HealthPattern {
  title: string;
  confidence: 'High' | 'Moderate';
  note: string;
}

export function detectHealthPatterns(s: WizardState): HealthPattern[] {
  const ids = s.meds.map((m) => m.medId);
  const syms = s.symptoms.selected || [];
  const patterns: HealthPattern[] = [];
  if (ids.includes('metformin') && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Tingling hands/feet'))) {
    patterns.push({ title: 'Metformin + B12 pattern', confidence: 'High', note: 'This combination of medication and symptoms can overlap with a B12-related pattern.' });
  }
  if (ids.includes('omeprazole') && (syms.includes('Muscle cramps') || syms.includes('Dizziness') || syms.includes('Fatigue'))) {
    patterns.push({ title: 'PPI + magnesium pattern', confidence: 'Moderate', note: 'Long-term acid suppression with these symptoms can overlap with a magnesium-related pattern.' });
  }
  if (ids.includes('atorvastatin') && (syms.includes('Muscle aches') || syms.includes('Fatigue'))) {
    patterns.push({ title: 'Statin tolerance pattern', confidence: 'Moderate', note: 'These symptoms can overlap with statin tolerance issues and possible CoQ10-related symptom patterns.' });
  }
  if (s.symptomOnlyMode && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Poor focus'))) {
    patterns.push({ title: 'Symptom-only B-vitamin support pattern', confidence: 'Moderate', note: 'Even without medications, this symptom cluster may overlap with B-vitamin support needs.' });
  }
  if (s.symptomOnlyMode && (syms.includes('Muscle cramps') || syms.includes('Sleep changes') || syms.includes('Anxiety'))) {
    patterns.push({ title: 'Symptom-only magnesium support pattern', confidence: 'Moderate', note: 'Even without medications, this symptom cluster may overlap with magnesium support needs.' });
  }
  return patterns;
}

export interface InsightResult {
  summary: string;
  meaning: string;
  doctorPrompt: string;
  patterns: HealthPattern[];
  interactions: AlertItem[];
  contraindications: AlertItem[];
  prediction: SuccessPrediction;
}

export function computeInsightEngine(s: WizardState): InsightResult {
  const patterns = detectHealthPatterns(s);
  const interactions = computeDrugInteractions(s);
  const contraindications = computeContraindications(s);
  const prediction = computeMedicationSuccessPrediction(s);
  const topScore = computeNutrientScores(s)[0];
  const symptomText = (s.symptoms.selected || []).slice(0, 4).join(', ') || 'no major symptoms logged';
  const medNames =
    s.meds
      .map((m) => {
        const med = MED_DB.find((x) => x.id === m.medId);
        return med ? med.name : m.medId;
      })
      .join(', ') || 'no medications selected';

  let summary = 'GeneoRx needs a little more information before it can generate a strong insight.';
  let meaning = 'Add symptoms, medications, or check-ins to improve the quality of your insights.';
  let doctorPrompt = 'Ask which labs, timing changes, or medication follow-up steps make the most sense for your situation.';

  if (patterns.length) {
    const top = patterns[0];
    summary = `Your current symptom pattern with ${medNames} may fit a ${top.title.toLowerCase()}.`;
    meaning = top.note || 'This pattern may help explain why symptoms are appearing or why your plan feels harder to follow.';
    doctorPrompt =
      interactions.length || contraindications.length
        ? `Discuss ${top.title}, plus the interaction/caution alerts GeneoRx found, with your clinician.`
        : `Discuss whether ${top.title} suggests labs, medication timing changes, or targeted support.`;
  } else if (topScore) {
    summary = `Your symptoms (${symptomText}) may reflect a ${topScore[0]} support need based on your current entries.`;
    meaning = `GeneoRx currently sees ${topScore[0]} as the strongest signal in your profile.`;
    doctorPrompt = `Ask whether ${topScore[0]} testing, monitoring, or treatment adjustments would be appropriate.`;
  }

  if (prediction.score < 50) {
    meaning += ' Your medication success prediction suggests this plan may be harder to sustain without support.';
  }
  if (interactions.length) {
    meaning += ` GeneoRx also detected ${interactions.length} interaction alert${interactions.length > 1 ? 's' : ''}.`;
  }
  if (contraindications.length) {
    meaning += ` There ${contraindications.length === 1 ? 'is' : 'are'} ${contraindications.length} caution flag${contraindications.length > 1 ? 's' : ''} that should be reviewed.`;
  }

  return { summary, meaning, doctorPrompt, patterns, interactions, contraindications, prediction };
}

export interface PopulationInsights {
  topSymptoms: string[];
  trackedSymptoms: string[];
  checkinCount: number;
  message: string;
}

export function computePopulationInsights(s: WizardState): PopulationInsights {
  const syms = s.symptoms.selected || [];
  const items = (s.checkins || []).flatMap((c) => c.symptoms?.items || []);
  const counts: Record<string, number> = {};
  items.forEach((i) => {
    counts[i.symptom] = (counts[i.symptom] || 0) + 1;
  });
  const topTracked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((x) => x[0]);
  return {
    topSymptoms: syms.slice(0, 3),
    trackedSymptoms: topTracked,
    checkinCount: s.checkins.length,
    message: s.checkins.length
      ? 'Based on your check-ins so far, GeneoRx is starting to identify repeat symptom patterns over time.'
      : 'Population-style insights will become stronger once you log check-ins over time.',
  };
}

/* ---------- routine builder ---------- */
export function buildRoutineFromSupplements(supps: string[]): Routine {
  const routine: Routine = { morning: [], midday: [], night: [], notes: [] };
  const s = (supps || []).map((x) => String(x).toLowerCase());
  const hasMg = s.some((x) => x.includes('magnesium'));
  const hasB12 = s.some((x) => x.includes('b12'));
  const hasCoq10 = s.some((x) => x.includes('coq10'));
  const hasD = s.some((x) => x.includes('vitamin d'));

  if (hasB12) routine.morning.push('Methyl B12 — morning (often energizing)');
  if (hasD) routine.morning.push('Vitamin D3 — with a meal that includes fat');
  if (hasCoq10) routine.midday.push('CoQ10 — with lunch (with food)');
  if (hasMg) routine.night.push('Magnesium glycinate — evening/night (often calming)');

  routine.notes.push('If nausea occurs, take supplements with food and reduce dose temporarily.');
  routine.notes.push('Avoid stacking new supplements all at once — phase in over 3–7 days.');
  routine.notes.push('Educational only; confirm timing/dose with clinician.');
  return routine;
}

/* ---------- coach / check-ins ---------- */
export function latestCheckin(s: WizardState): WizardCheckin | null {
  if (!s.checkins.length) return null;
  return s.checkins[s.checkins.length - 1];
}

export interface CoachMessage {
  headline: string;
  bullets: string[];
  nextBestAction: string;
}

export function computeWeeklyCoachMessage(s: WizardState): CoachMessage {
  const last = latestCheckin(s);
  const base = s.wellbeingBaseline || { energy: 5, mood: 5, sleep: 5, focus: 5 };
  const scores = computeNutrientScores(s);
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : '—';

  if (!last) {
    return {
      headline: 'Your coach is ready.',
      bullets: [
        'Add medications + symptoms to personalize results.',
        'Start your plan to track real improvement over time.',
        'Log a weekly check-in to generate your Health Signal.',
      ],
      nextBestAction: 'Go to Results → Start plan.',
    };
  }

  const dE = last.wellbeing.energy - base.energy;
  const dM = last.wellbeing.mood - base.mood;
  const dS = last.wellbeing.sleep - base.sleep;
  const dF = last.wellbeing.focus - base.focus;

  const items = last.symptoms?.items || [];
  const best = items.reduce<CheckinItemAcc>((acc, x) => (acc === null || (x.changeScore || 0) > (acc.changeScore || 0) ? x : acc), null);
  const worst = items.reduce<CheckinItemAcc>((acc, x) => (acc === null || (x.changeScore || 0) < (acc.changeScore || 0) ? x : acc), null);

  let next = 'Keep the routine consistent for 7 days and log another check-in.';
  if (last.adherencePct < 60) next = 'Try one reminder and aim for 70–80% adherence this week.';
  else if ((worst?.change || '') === 'Worse') next = `Adjust timing/with-food strategy and reassess ${worst?.symptom} next week.`;
  else if (dE <= 0 && dS <= 0) next = 'Try hydration + protein at breakfast for 7 days, then reassess energy/sleep.';
  else if (dE > 0 || dS > 0) next = 'Nice trend — keep the same plan for one more week to confirm the signal.';

  const bullets = [
    `Wellbeing deltas: Energy ${dE >= 0 ? '+' : ''}${dE}, Mood ${dM >= 0 ? '+' : ''}${dM}, Sleep ${dS >= 0 ? '+' : ''}${dS}, Focus ${dF >= 0 ? '+' : ''}${dF}.`,
    `Most improved symptom: ${best?.symptom ? `${best.symptom} (${best.change})` : '—'}.`,
    `Least improved symptom: ${worst?.symptom ? `${worst.symptom} (${worst.change})` : '—'}.`,
    `Top driver nutrient: ${topDriver}.`,
  ];

  const headline =
    dE + dS + dM + dF > 0 ? 'You’re trending in the right direction.' : dE + dS + dM + dF < 0 ? 'Let’s stabilize this week.' : 'Let’s get a clearer signal.';

  return { headline, bullets, nextBestAction: next };
}

type CheckinItemAcc = WizardCheckin['symptoms']['items'][number] | null;

/* ---------- clinician snapshot ---------- */
export function buildClinicianSnapshotText(s: WizardState): string {
  const flags = safetyFlags(s);
  const meds = s.meds.map((m) => {
    const med = MED_DB.find((x) => x.id === m.medId);
    const nm = med ? med.name : m.medId;
    return `- ${nm} • dose: ${m.dose} • duration: ${m.durationMonths || 0} months`;
  });

  const last = latestCheckin(s);
  const scores = computeNutrientScores(s);
  const top = scores.slice(0, 6).map(([n, sc]) => `- ${n}: ${tierFromScore(sc)} signal (${sc}%)`);
  const interactions = computeDrugInteractions(s).map((x) => `- ${x.title} (${x.level})`);
  const contraindications = computeContraindications(s).map((x) => `- ${x.title} (${x.level})`);
  const success = computeMedicationSuccessPrediction(s);
  const patterns = detectHealthPatterns(s).map((x) => `- ${x.title} (${x.confidence})`);

  const supp = s.plan.recommendedSupplements || [];
  const adh = last ? `${last.adherencePct}%` : '—';
  const labs = uniq(scores.slice(0, 5).flatMap(([n]) => LAB_SUGGESTIONS[n] || [])).slice(0, 8);
  const symptoms = s.symptoms.selected.length ? s.symptoms.selected.join(', ') : 'None selected';
  const lastDate = last ? fmtDate(last.dateISO) : '—';

  return [
    'GENEORX — YOUR DOCTOR VISIT SNAPSHOT',
    '===================================',
    '',
    `Patient: ${s.account.email || 'Anonymous'} • Age: ${s.profile.age || '—'} • Gender: ${s.profile.gender || '—'}`,
    `Safety flags: ${flags.length ? flags.join(', ') : 'None reported'}`,
    `Medication success prediction: ${success.score}% (${success.level})`,
    '',
    'Medications:',
    meds.length ? meds.join('\n') : '- None reported',
    '',
    `Symptoms (recent): ${symptoms}`,
    '',
    'Nutrient risk signals (GeneoRx estimate):',
    top.length ? top.join('\n') : '- No signals yet (add meds/symptoms)',
    '',
    'Drug interactions:',
    interactions.length ? interactions.join('\n') : '- None identified from current internal rules',
    '',
    'Contraindications / cautions:',
    contraindications.length ? contraindications.join('\n') : '- None identified from current safety rules',
    '',
    'Pattern detection:',
    patterns.length ? patterns.join('\n') : '- No strong pattern detected yet',
    '',
    'Current protocol (supplement support):',
    supp.length ? supp.map((x) => `- ${x}`).join('\n') : '- Not started / none saved',
    `Adherence (latest check-in): ${adh}`,
    '',
    'Optional labs to consider (clinical context needed):',
    labs.length ? labs.map((x) => `- ${x}`).join('\n') : '- —',
    '',
    `Latest check-in date: ${lastDate}`,
    '',
    'Note: Educational guidance with evidence transparency; confirm labs, dosing, and interactions with your clinician.',
  ].join('\n');
}
