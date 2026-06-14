// GeneoRx scoring / evidence / insight engine — ported from the website portal.
// All functions are pure and take the wizard state as input.

import {
  MED_DB,
  GENERIC_SYMPTOMS,
  SUPPLEMENT_MAP,
  LAB_SUGGESTIONS,
  type MedEntry,
  type MedClaim,
  type SourceQuality,
} from '@/content/wizardData';
import type { Dose, Routine, Severity, WizardCheckin, WizardState } from '@/wizard/types';

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

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
  const doiPrefixed = t.match(/^DOI:\s*(10\.\S+)$/i);
  if (doiPrefixed) return `https://doi.org/${doiPrefixed[1]}`;
  if (/^10\.\d{4,}\/\S+$/i.test(t)) return `https://doi.org/${t}`;
  if (/^https?:\/\/\S+$/i.test(t)) return t;
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
export function safetyFlags(s: WizardState, t: TranslateFn): string[] {
  const p = s.profile || {};
  const flags: string[] = [];
  if (p.pregnant) flags.push(t('flag.pregnant'));
  if (p.kidneyDisease) flags.push(t('flag.kidney'));
  if (p.anticoagulants) flags.push(t('flag.anticoag'));
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

export function impactLabel(change: string, t: TranslateFn): string {
  const map: Record<string, string> = {
    Worse: 'impact.worse',
    'No change': 'impact.no_change',
    'Slightly better': 'impact.slightly_better',
    'Much better': 'impact.much_better',
    'Not present': 'impact.not_present',
  };
  return map[change] ? t(map[change]) : String(change || '');
}

export function successLabel(level: string, t: TranslateFn): string {
  const map: Record<string, string> = {
    Strong: 'success.strong',
    Moderate: 'success.moderate',
    'At risk': 'success.at_risk',
  };
  return map[level] ? t(map[level]) : String(level || '');
}

function fmtDelta(n: number): string {
  return `${n >= 0 ? '+' : ''}${n}`;
}

/* ---------- interactions / contraindications ---------- */
export interface AlertItem {
  title: string;
  level: AlertLevel;
  note: string;
  action: string;
}

export function computeDrugInteractions(s: WizardState, t: TranslateFn): AlertItem[] {
  const ids = s.meds.map((m) => m.medId);
  const out: AlertItem[] = [];
  if (ids.includes('metformin') && ids.includes('omeprazole')) {
    out.push({
      title: t('engine.interaction.metformin_omeprazole.title'),
      level: 'Moderate',
      note: t('engine.interaction.metformin_omeprazole.note'),
      action: t('engine.interaction.metformin_omeprazole.action'),
    });
  }
  if (ids.includes('lisinopril') && ids.includes('losartan')) {
    out.push({
      title: t('engine.interaction.lisinopril_losartan.title'),
      level: 'High',
      note: t('engine.interaction.lisinopril_losartan.note'),
      action: t('engine.interaction.lisinopril_losartan.action'),
    });
  }
  if (ids.includes('amlodipine') && ids.includes('metoprolol')) {
    out.push({
      title: t('engine.interaction.amlodipine_metoprolol.title'),
      level: 'Moderate',
      note: t('engine.interaction.amlodipine_metoprolol.note'),
      action: t('engine.interaction.amlodipine_metoprolol.action'),
    });
  }
  return out;
}

export function computeContraindications(s: WizardState, t: TranslateFn): AlertItem[] {
  const ids = s.meds.map((m) => m.medId);
  const flags: AlertItem[] = [];
  if (s.profile.pregnant && (ids.includes('lisinopril') || ids.includes('losartan'))) {
    flags.push({
      title: t('engine.contra.pregnancy_ace_arb.title'),
      level: 'High',
      note: t('engine.contra.pregnancy_ace_arb.note'),
      action: t('engine.contra.pregnancy_ace_arb.action'),
    });
  }
  if (s.profile.kidneyDisease && (ids.includes('metformin') || ids.includes('lisinopril') || ids.includes('losartan'))) {
    flags.push({
      title: t('engine.contra.kidney.title'),
      level: 'High',
      note: t('engine.contra.kidney.note'),
      action: t('engine.contra.kidney.action'),
    });
  }
  if (s.profile.anticoagulants && s.plan.recommendedSupplements.some((x) => String(x).toLowerCase().includes('coq10'))) {
    flags.push({
      title: t('engine.contra.anticoag_supplement.title'),
      level: 'Moderate',
      note: t('engine.contra.anticoag_supplement.note'),
      action: t('engine.contra.anticoag_supplement.action'),
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

export function computeMedicationSuccessPrediction(s: WizardState, t: TranslateFn): SuccessPrediction {
  let score = 50;
  if (s.plan.started) score += 10;
  if (s.checkins.length >= 2) score += 10;
  if (s.symptoms.severity === 'severe') score -= 15;
  if (s.symptoms.selected.length >= 4) score -= 10;
  score -= computeDrugInteractions(s, t).length * 8;
  score -= computeContraindications(s, t).length * 10;
  const last = latestCheckin(s);
  if (last) {
    if (last.adherencePct >= 80) score += 15;
    else if (last.adherencePct < 60) score -= 15;
  }
  score = clamp(score, 0, 100);
  const level: SuccessPrediction['level'] = score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'At risk';
  const reason =
    score >= 75
      ? t('engine.prediction.reason_strong')
      : score >= 50
        ? t('engine.prediction.reason_moderate')
        : t('engine.prediction.reason_at_risk');
  return { score, level, reason };
}

export interface HealthPattern {
  title: string;
  confidence: 'High' | 'Moderate';
  note: string;
}

export function detectHealthPatterns(s: WizardState, t: TranslateFn): HealthPattern[] {
  const ids = s.meds.map((m) => m.medId);
  const syms = s.symptoms.selected || [];
  const patterns: HealthPattern[] = [];
  if (ids.includes('metformin') && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Tingling hands/feet'))) {
    patterns.push({ title: t('engine.pattern.metformin_b12.title'), confidence: 'High', note: t('engine.pattern.metformin_b12.note') });
  }
  if (ids.includes('omeprazole') && (syms.includes('Muscle cramps') || syms.includes('Dizziness') || syms.includes('Fatigue'))) {
    patterns.push({ title: t('engine.pattern.ppi_magnesium.title'), confidence: 'Moderate', note: t('engine.pattern.ppi_magnesium.note') });
  }
  if (ids.includes('atorvastatin') && (syms.includes('Muscle aches') || syms.includes('Fatigue'))) {
    patterns.push({ title: t('engine.pattern.statin.title'), confidence: 'Moderate', note: t('engine.pattern.statin.note') });
  }
  if (s.symptomOnlyMode && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Poor focus'))) {
    patterns.push({ title: t('engine.pattern.symptom_bvitamin.title'), confidence: 'Moderate', note: t('engine.pattern.symptom_bvitamin.note') });
  }
  if (s.symptomOnlyMode && (syms.includes('Muscle cramps') || syms.includes('Sleep changes') || syms.includes('Anxiety'))) {
    patterns.push({ title: t('engine.pattern.symptom_magnesium.title'), confidence: 'Moderate', note: t('engine.pattern.symptom_magnesium.note') });
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

export function computeInsightEngine(s: WizardState, t: TranslateFn): InsightResult {
  const patterns = detectHealthPatterns(s, t);
  const interactions = computeDrugInteractions(s, t);
  const contraindications = computeContraindications(s, t);
  const prediction = computeMedicationSuccessPrediction(s, t);
  const topScore = computeNutrientScores(s)[0];
  const symptomText = (s.symptoms.selected || []).slice(0, 4).join(', ') || t('engine.insight.no_symptoms');
  const medNames =
    s.meds
      .map((m) => {
        const med = MED_DB.find((x) => x.id === m.medId);
        return med ? med.name : m.medId;
      })
      .join(', ') || t('engine.insight.no_meds');

  let summary = t('engine.insight.summary_empty');
  let meaning = t('engine.insight.meaning_empty');
  let doctorPrompt = t('engine.insight.doctor_empty');

  if (patterns.length) {
    const top = patterns[0];
    summary = t('engine.insight.summary_pattern', { meds: medNames, pattern: top.title.toLowerCase() });
    meaning = top.note || t('engine.insight.meaning_default');
    doctorPrompt =
      interactions.length || contraindications.length
        ? t('engine.insight.doctor_pattern_alerts', { pattern: top.title })
        : t('engine.insight.doctor_pattern', { pattern: top.title });
  } else if (topScore) {
    summary = t('engine.insight.summary_nutrient', { symptoms: symptomText, nutrient: topScore[0] });
    meaning = t('engine.insight.meaning_nutrient', { nutrient: topScore[0] });
    doctorPrompt = t('engine.insight.doctor_nutrient', { nutrient: topScore[0] });
  }

  if (prediction.score < 50) {
    meaning += t('engine.insight.meaning_low_prediction');
  }
  if (interactions.length) {
    meaning += interactions.length > 1
      ? t('engine.insight.meaning_interactions_many', { count: interactions.length })
      : t('engine.insight.meaning_interactions_one', { count: interactions.length });
  }
  if (contraindications.length) {
    meaning += contraindications.length > 1
      ? t('engine.insight.meaning_cautions_many', { count: contraindications.length })
      : t('engine.insight.meaning_cautions_one', { count: contraindications.length });
  }

  return { summary, meaning, doctorPrompt, patterns, interactions, contraindications, prediction };
}

export interface PopulationInsights {
  topSymptoms: string[];
  trackedSymptoms: string[];
  checkinCount: number;
  message: string;
}

export function computePopulationInsights(s: WizardState, t: TranslateFn): PopulationInsights {
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
    message: s.checkins.length ? t('engine.population.with_checkins') : t('engine.population.no_checkins'),
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

export function computeWeeklyCoachMessage(s: WizardState, t: TranslateFn): CoachMessage {
  const last = latestCheckin(s);
  const base = s.wellbeingBaseline || { energy: 5, mood: 5, sleep: 5, focus: 5 };
  const scores = computeNutrientScores(s);
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : t('engine.coach.bullet_empty');

  if (!last) {
    return {
      headline: t('engine.coach.headline_ready'),
      bullets: [
        t('engine.coach.bullet_add_meds'),
        t('engine.coach.bullet_start_plan'),
        t('engine.coach.bullet_log_checkin'),
      ],
      nextBestAction: t('engine.coach.action_results'),
    };
  }

  const dE = last.wellbeing.energy - base.energy;
  const dM = last.wellbeing.mood - base.mood;
  const dS = last.wellbeing.sleep - base.sleep;
  const dF = last.wellbeing.focus - base.focus;

  const items = last.symptoms?.items || [];
  const best = items.reduce<CheckinItemAcc>((acc, x) => (acc === null || (x.changeScore || 0) > (acc.changeScore || 0) ? x : acc), null);
  const worst = items.reduce<CheckinItemAcc>((acc, x) => (acc === null || (x.changeScore || 0) < (acc.changeScore || 0) ? x : acc), null);

  let next = t('engine.coach.action_consistent');
  if (last.adherencePct < 60) next = t('engine.coach.action_adherence');
  else if ((worst?.change || '') === 'Worse') next = t('engine.coach.action_worse_symptom', { symptom: worst?.symptom ?? '' });
  else if (dE <= 0 && dS <= 0) next = t('engine.coach.action_hydration');
  else if (dE > 0 || dS > 0) next = t('engine.coach.action_nice_trend');

  const bestValue = best?.symptom ? `${best.symptom} (${impactLabel(best.change || 'No change', t)})` : t('engine.coach.bullet_empty');
  const worstValue = worst?.symptom ? `${worst.symptom} (${impactLabel(worst.change || 'No change', t)})` : t('engine.coach.bullet_empty');

  const bullets = [
    t('engine.coach.bullet_wellbeing', { dE: fmtDelta(dE), dM: fmtDelta(dM), dS: fmtDelta(dS), dF: fmtDelta(dF) }),
    t('engine.coach.bullet_best', { value: bestValue }),
    t('engine.coach.bullet_worst', { value: worstValue }),
    t('engine.coach.bullet_driver', { driver: topDriver }),
  ];

  const headline =
    dE + dS + dM + dF > 0
      ? t('engine.coach.headline_trending_up')
      : dE + dS + dM + dF < 0
        ? t('engine.coach.headline_stabilize')
        : t('engine.coach.headline_clearer_signal');

  return { headline, bullets, nextBestAction: next };
}

type CheckinItemAcc = WizardCheckin['symptoms']['items'][number] | null;

function resolveMedName(medId: string, catalog?: MedEntry[]): string {
  const db = catalog?.length ? catalog : MED_DB;
  const med = db.find((x) => x.id === medId);
  return med ? med.name : medId.replace(/^custom[:_]/, '').replace(/-/g, ' ');
}

/* ---------- clinician snapshot ---------- */
export function buildClinicianSnapshotText(
  s: WizardState,
  t: TranslateFn,
  checkinIndex?: number,
  catalog?: MedEntry[],
): string {
  const flags = safetyFlags(s, t);
  const meds = s.meds.map((m) => {
    const nm = resolveMedName(m.medId, catalog);
    const dose = m.dose === 'med' ? 'medium' : m.dose;
    return `- ${nm} • dose: ${dose} • duration: ${m.durationMonths || 0} months`;
  });

  let checkin = null;
  let resolvedIndex: number | null = null;
  if (s.checkins.length) {
    let idx =
      typeof checkinIndex === 'number' && checkinIndex >= 0 && checkinIndex < s.checkins.length
        ? checkinIndex
        : s.checkins.length - 1;
    resolvedIndex = idx;
    checkin = s.checkins[idx];
  }

  const base = s.wellbeingBaseline || { energy: 5, mood: 5, sleep: 5, focus: 5 };
  const scores = computeNutrientScores(s);
  const top = scores.slice(0, 6).map(([n, sc]) => `- ${n}: ${tierFromScore(sc)} signal (${sc}%)`);
  const interactions = computeDrugInteractions(s, t).map((x) => `- ${x.title} (${x.level})`);
  const contraindications = computeContraindications(s, t).map((x) => `- ${x.title} (${x.level})`);
  const success = computeMedicationSuccessPrediction(s, t);
  const patterns = detectHealthPatterns(s, t).map((x) => `- ${x.title} (${x.confidence})`);

  const supp = s.plan.recommendedSupplements || [];
  const adh = checkin ? `${checkin.adherencePct}%` : '—';
  const labs = uniq(scores.slice(0, 5).flatMap(([n]) => LAB_SUGGESTIONS[n] || [])).slice(0, 8);
  const symptoms = s.symptoms.selected.length ? s.symptoms.selected.join(', ') : 'None selected';
  const lastDate = checkin ? fmtDate(checkin.dateISO) : '—';

  const checkinLines: string[] = [];
  if (checkin) {
    const wb = checkin.wellbeing || base;
    const dE = (wb.energy ?? 0) - base.energy;
    const dM = (wb.mood ?? 0) - base.mood;
    const dS = (wb.sleep ?? 0) - base.sleep;
    const dF = (wb.focus ?? 0) - base.focus;
    const symItems = (checkin.symptoms?.items || []).map(
      (x) => `- ${x.symptom}: ${x.change || 'No change'}`,
    );
    const sideEffects = Array.isArray(checkin.sideEffects)
      ? checkin.sideEffects
      : checkin.sideEffects
        ? [checkin.sideEffects]
        : [];
    checkinLines.push(
      `Selected check-in: Check-in ${(resolvedIndex ?? 0) + 1} · ${lastDate}`,
      `Adherence: ${adh}`,
      `Wellbeing: Energy ${wb.energy ?? '—'}/10 · Mood ${wb.mood ?? '—'}/10 · Sleep ${wb.sleep ?? '—'}/10 · Focus ${wb.focus ?? '—'}/10`,
      `Change vs baseline: Energy ${dE >= 0 ? '+' : ''}${dE}, Mood ${dM >= 0 ? '+' : ''}${dM}, Sleep ${dS >= 0 ? '+' : ''}${dS}, Focus ${dF >= 0 ? '+' : ''}${dF}`,
      'Symptom changes this check-in:',
      symItems.length ? symItems.join('\n') : '- None tracked',
      `Supplements taken: ${(checkin.supplementsTaken || []).length ? checkin.supplementsTaken.join(', ') : 'None logged'}`,
      `Side effects: ${sideEffects.length ? sideEffects.join(', ') : 'None'}`,
      `Notes: ${checkin.notes || 'None'}`,
    );
  }

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
    '',
    ...(checkinLines.length
      ? ['Check-in details:', ...checkinLines, '']
      : [`Adherence (latest check-in): ${adh}`, '', `Latest check-in date: ${lastDate}`, '']),
    'Optional labs to consider (clinical context needed):',
    labs.length ? labs.map((x) => `- ${x}`).join('\n') : '- —',
    '',
    'Note: Educational guidance with evidence transparency; confirm labs, dosing, and interactions with your clinician.',
  ].join('\n');
}
