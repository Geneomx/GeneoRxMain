import { BASE_MED_DB } from './baseData';
import { getMedDb } from './medDb';
import { GENERIC_SYMPTOMS, LAB_SUGGESTIONS, SUPPLEMENT_MAP, type GeneoState, type MedDef } from './types';

export { GENERIC_SYMPTOMS, SUPPLEMENT_MAP, LAB_SUGGESTIONS } from './types';

/* ========= util ========= */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
export function escapeText(s: string | number | null | undefined): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
export function citationToLink(token: string): string {
  const t = String(token || '').trim();
  if (/^PMID:\d+$/i.test(t)) {
    return `https://pubmed.ncbi.nlm.nih.gov/${t.split(':')[1]}/`;
  }
  if (/^PMCID:PMC\d+$/i.test(t)) {
    const id = t.split(':')[1].toUpperCase();
    return `https://pmc.ncbi.nlm.nih.gov/articles/${id}/`;
  }
  const doiPrefixed = t.match(/^DOI:\s*(10\.\S+)$/i);
  if (doiPrefixed) return `https://doi.org/${doiPrefixed[1]}`;
  if (/^10\.\d{4,}\/\S+$/i.test(t)) return `https://doi.org/${t}`;
  if (/^https?:\/\/\S+$/i.test(t)) return t;
  return '';
}
export function doseFactor(d: string): number {
  return d === 'low' ? 0.85 : d === 'high' ? 1.25 : 1.0;
}
export function durationFactor(months: number): number {
  const m = clamp(months || 0, 0, 24);
  return 0.55 + (m / 24) * 0.75;
}
export function severityFactor(sev: string): number {
  return sev === 'severe' ? 1.35 : sev === 'moderate' ? 1.15 : 1.0;
}
export function qualityWeight(q: string): number {
  return q === 'High' ? 4 : q === 'Moderate' ? 3 : 2;
}
export function tierFromScore(score: number): 'High' | 'Moderate' | 'Low' {
  if (score >= 70) return 'High';
  if (score >= 45) return 'Moderate';
  return 'Low';
}

export function computeNutrientScores(state: GeneoState): [string, number][] {
  const scores: Record<string, number> = {};
  const sevF = severityFactor(state.symptoms.severity);
  const MED = getMedDb();

  for (const mi of state.meds) {
    const med = MED.find((x) => x.id === mi.medId);
    if (!med) continue;
    const f = doseFactor(mi.dose) * durationFactor(mi.durationMonths) * sevF;
    for (const cl of med.claims || []) {
      const w = qualityWeight(cl.source_quality) * 10 * f;
      scores[cl.nutrient] = (scores[cl.nutrient] || 0) + w;
    }
  }
  if (Object.keys(scores).length === 0 && state.symptoms.selected.length) {
    const burden = state.symptoms.selected.length * 9 * sevF;
    scores['Magnesium'] = (scores['Magnesium'] || 0) + burden;
    scores['B vitamins'] = (scores['B vitamins'] || 0) + burden * 0.85;
    scores['Vitamin D'] = (scores['Vitamin D'] || 0) + burden * 0.6;
  }
  return Object.entries(scores)
    .map(([k, v]) => [k, clamp(Math.round(v), 0, 100)] as [string, number])
    .sort((a, b) => b[1] - a[1]);
}

export function recommendSupplements(
  nutrientScores: [string, number][],
): { nutrient: string; tier: 'High' | 'Moderate' | 'Low'; supplement: string; score: number }[] {
  const out: { nutrient: string; tier: 'High' | 'Moderate' | 'Low'; supplement: string; score: number }[] = [];
  for (const [nut, score] of nutrientScores.slice(0, 10)) {
    const tier = tierFromScore(score);
    const sups = SUPPLEMENT_MAP[nut] || [];
    for (const s of sups) {
      out.push({ nutrient: nut, tier, supplement: s, score });
    }
  }
  const rank = { High: 3, Moderate: 2, Low: 1 };
  const best = new Map<string, (typeof out)[0]>();
  for (const item of out) {
    const prev = best.get(item.supplement);
    if (!prev || rank[item.tier] > rank[prev.tier]) best.set(item.supplement, item);
  }
  return [...best.values()]
    .sort((a, b) => (rank[b.tier] !== rank[a.tier] ? rank[b.tier] - rank[a.tier] : (b.score || 0) - (a.score || 0)))
    .slice(0, 10);
}

export type ClaimRow = {
  medId: string;
  medName: string;
  nutrient: string;
  source_quality: string;
  citations: string[];
  notes?: string | string[];
};

export function claimsForSelectedMeds(state: GeneoState): ClaimRow[] {
  const out: ClaimRow[] = [];
  const MED = getMedDb();
  for (const mi of state.meds) {
    const med = MED.find((x) => x.id === mi.medId);
    if (!med) continue;
    for (const cl of med.claims || []) {
      out.push({ medId: med.id, medName: med.name, ...cl, citations: cl.citations || [] });
    }
  }
  return out;
}

export function aggregateEvidenceByNutrient(claims: ClaimRow[]): Record<string, ClaimRow[]> {
  const map: Record<string, ClaimRow[]> = {};
  for (const cl of claims) {
    if (!map[cl.nutrient]) map[cl.nutrient] = [];
    map[cl.nutrient].push(cl);
  }
  return map;
}
export function summarizeSourceQuality(claims: ClaimRow[]): string {
  const qs = (claims || []).map((c) => c.source_quality).filter(Boolean);
  if (qs.includes('High')) return 'High';
  if (qs.includes('Moderate')) return 'Moderate';
  if (qs.includes('Preliminary')) return 'Preliminary';
  return 'Pending';
}
export function badgeClassForQuality(q: string): 'high' | 'mod' | 'pre' | 'pending' {
  if (q === 'High') return 'high';
  if (q === 'Moderate') return 'mod';
  if (q === 'Preliminary') return 'pre';
  return 'pending';
}

export function evidencePanelContent(nutrient: string, claims: ClaimRow[] | null | undefined): {
  labsLine: string;
  citations: string[];
  noteText: string;
  hasClaims: boolean;
} {
  const labs = LAB_SUGGESTIONS[nutrient] || [];
  const labsLine = labs.length
    ? `Optional labs to confirm: ${labs.join(', ')}`
    : 'Optional labs to confirm: ask your clinician based on context.';

  if (!claims || !claims.length) {
    return { labsLine, citations: [], noteText: '', hasClaims: false };
  }
  const seen = new Set<string>();
  const citations: string[] = [];
  const notes: string[] = [];
  for (const cl of claims) {
    (cl.citations || []).forEach((id) => {
      const key = String(id || '').trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      citations.push(key);
    });
    if (cl.notes && String(cl.notes).trim()) notes.push(String(cl.notes).trim());
  }
  return {
    labsLine,
    citations: citations.slice(0, 6),
    noteText: uniq(notes).slice(0, 3).join(' '),
    hasClaims: true,
  };
}

export function evidenceCoverage(state: GeneoState): { selectedCount: number; evidenceCount: number } {
  const selected = state.meds.map((m) => m.medId);
  const MED = getMedDb();
  const evidenceCount = selected.filter((id) => {
    const med = MED.find((x) => x.id === id);
    return med && (med.claims || []).some((c) => (c.citations || []).length > 0);
  }).length;
  return { selectedCount: selected.length, evidenceCount };
}

export function safetyFlags(state: GeneoState): string[] {
  const p = state.profile || ({} as GeneoState['profile']);
  const flags: string[] = [];
  if (p.pregnant) flags.push('Pregnant/breastfeeding');
  if (p.kidneyDisease) flags.push('Kidney disease');
  if (p.anticoagulants) flags.push('Anticoagulants/blood thinners');
  return flags;
}

export function getSymptomUniverse(state: GeneoState): string[] {
  const MED = getMedDb();
  const base = state.meds.length
    ? (() => {
        const chips: string[] = [];
        state.meds.forEach((mi) => {
          const med = MED.find((x) => x.id === mi.medId);
          if (med) chips.push(...(med.symptomChips || []));
        });
        return uniq(chips).slice(0, 24);
      })()
    : GENERIC_SYMPTOMS.slice();
  return uniq([...(base || []), ...((state.symptoms && state.symptoms.custom) || [])]).slice(0, 40);
}

export function mergeCustomSymptom(state: GeneoState, sym: string): GeneoState {
  const value = String(sym || '').trim();
  if (!value) return state;
  const custom = state.symptoms.custom.includes(value)
    ? state.symptoms.custom
    : [...state.symptoms.custom, value];
  const selected = state.symptoms.selected.includes(value)
    ? state.symptoms.selected
    : [...state.symptoms.selected, value];
  return {
    ...state,
    symptoms: { ...state.symptoms, custom, selected },
  };
}

type Interaction = { title: string; level: 'High' | 'Moderate' | 'Low'; note: string; action: string };

export function computeDrugInteractions(state: GeneoState): Interaction[] {
  const ids = state.meds.map((m) => m.medId);
  const interactions: Interaction[] = [];
  if (ids.includes('metformin') && ids.includes('omeprazole')) {
    interactions.push({
      title: 'Metformin + Omeprazole',
      level: 'Moderate',
      note: 'This combination may increase the chance that B12-related symptoms or magnesium-related symptoms are overlooked over time.',
      action: 'Discuss B12 / magnesium monitoring and symptom tracking with your clinician.',
    });
  }
  if (ids.includes('lisinopril') && ids.includes('losartan')) {
    interactions.push({
      title: 'Lisinopril + Losartan',
      level: 'High',
      note: 'Using an ACE inhibitor and ARB together can increase monitoring needs for kidney function and potassium.',
      action: 'Review this combination with your clinician unless it was specifically prescribed and monitored.',
    });
  }
  if (ids.includes('amlodipine') && ids.includes('metoprolol')) {
    interactions.push({
      title: 'Amlodipine + Metoprolol',
      level: 'Moderate',
      note: 'This combination may increase dizziness, low energy, or exercise intolerance in some users.',
      action: 'Track dizziness and blood pressure symptoms, especially after dose changes.',
    });
  }
  return interactions;
}

type Contra = { title: string; level: 'High' | 'Moderate' | 'Low'; note: string; action: string };

export function computeContraindications(state: GeneoState): Contra[] {
  const ids = state.meds.map((m) => m.medId);
  const flags: Contra[] = [];
  if (state.profile.pregnant && (ids.includes('lisinopril') || ids.includes('losartan'))) {
    flags.push({
      title: 'Pregnancy caution with ACE inhibitor / ARB therapy',
      level: 'High',
      note: 'Lisinopril and losartan need clinician review if pregnancy is present or possible.',
      action: 'Contact your clinician promptly for medication review.',
    });
  }
  if (state.profile.kidneyDisease && (ids.includes('metformin') || ids.includes('lisinopril') || ids.includes('losartan'))) {
    flags.push({
      title: 'Kidney disease monitoring needed',
      level: 'High',
      note: "This medication profile increases the importance of kidney function and electrolyte monitoring.",
      action: 'Do not add new supplements casually until renal status and labs are reviewed.',
    });
  }
  if (state.profile.anticoagulants && state.plan.recommendedSupplements.some((x) => String(x).toLowerCase().includes('coq10'))) {
    flags.push({
      title: 'Supplement review recommended with blood thinners',
      level: 'Moderate',
      note: 'Some supplements should be reviewed more carefully when anticoagulants are part of the profile.',
      action: 'Ask your clinician or pharmacist to review supplement safety and timing.',
    });
  }
  return flags;
}

export function levelClass(level: string): string {
  if (level === 'High') return 'alertHigh';
  if (level === 'Moderate') return 'alertModerate';
  return 'alertLow';
}

export function computeMedicationSuccessPrediction(state: GeneoState): { score: number; level: string; reason: string } {
  let score = 50;
  if (state.plan.started) score += 10;
  if (state.checkins.length >= 2) score += 10;
  if (state.symptoms.severity === 'severe') score -= 15;
  if (state.symptoms.selected.length >= 4) score -= 10;
  score -= computeDrugInteractions(state).length * 8;
  score -= computeContraindications(state).length * 10;
  const last = latestCheckin(state);
  if (last) {
    if (last.adherencePct >= 80) score += 15;
    else if (last.adherencePct < 60) score -= 15;
  }
  score = clamp(score, 0, 100);
  const level = score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'At risk';
  const reason =
    score >= 75
      ? 'Your current inputs suggest a better chance of staying consistent with this plan.'
      : score >= 50
        ? 'Your plan may work, but symptoms, complexity, or follow-through could reduce success.'
        : 'Your current symptom burden or safety complexity may make long-term success harder without closer support.';
  return { score, level, reason };
}

type Pattern = { title: string; confidence: string; note: string };

export function detectHealthPatterns(state: GeneoState): Pattern[] {
  const ids = state.meds.map((m) => m.medId);
  const syms = state.symptoms.selected || [];
  const patterns: Pattern[] = [];
  if (ids.includes('metformin') && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Tingling hands/feet'))) {
    patterns.push({
      title: 'Metformin + B12 pattern',
      confidence: 'High',
      note: 'This combination of medication and symptoms can overlap with a B12-related pattern.',
    });
  }
  if (ids.includes('omeprazole') && (syms.includes('Muscle cramps') || syms.includes('Dizziness') || syms.includes('Fatigue'))) {
    patterns.push({
      title: 'PPI + magnesium pattern',
      confidence: 'Moderate',
      note: 'Long-term acid suppression with these symptoms can overlap with a magnesium-related pattern.',
    });
  }
  if (ids.includes('atorvastatin') && (syms.includes('Muscle aches') || syms.includes('Fatigue'))) {
    patterns.push({
      title: 'Statin tolerance pattern',
      confidence: 'Moderate',
      note: 'These symptoms can overlap with statin tolerance issues and possible CoQ10-related symptom patterns.',
    });
  }
  if (state.symptomOnlyMode && (syms.includes('Fatigue') || syms.includes('Brain fog') || syms.includes('Poor focus'))) {
    patterns.push({
      title: 'Symptom-only B-vitamin support pattern',
      confidence: 'Moderate',
      note: 'Even without medications, this symptom cluster may overlap with B-vitamin support needs.',
    });
  }
  if (state.symptomOnlyMode && (syms.includes('Muscle cramps') || syms.includes('Sleep changes') || syms.includes('Anxiety'))) {
    patterns.push({
      title: 'Symptom-only magnesium support pattern',
      confidence: 'Moderate',
      note: 'Even without medications, this symptom cluster may overlap with magnesium support needs.',
    });
  }
  return patterns;
}

export function computeInsightEngine(state: GeneoState): {
  summary: string;
  meaning: string;
  doctorPrompt: string;
  patterns: Pattern[];
  interactions: Interaction[];
  contraindications: Contra[];
  prediction: { score: number; level: string; reason: string };
} {
  const patterns = detectHealthPatterns(state);
  const interactions = computeDrugInteractions(state);
  const contraindications = computeContraindications(state);
  const prediction = computeMedicationSuccessPrediction(state);
  const topScore = computeNutrientScores(state)[0];
  const symptomText = (state.symptoms.selected || []).slice(0, 4).join(', ') || 'no major symptoms logged';
  const MED = getMedDb();
  const medNames = state.meds
    .map((m) => {
      const med = MED.find((x) => x.id === m.medId);
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

export function generateDynamicHealthStory(state: GeneoState): string {
  const MED = getMedDb();
  const medNames = state.meds.map((m) => {
    const med = MED.find((x) => x.id === m.medId);
    return med ? med.name : m.medId;
  });
  const symptoms = state.symptoms?.selected || [];
  const severity = state.symptoms?.severity || 'mild';
  const patterns = detectHealthPatterns(state);
  const success = computeMedicationSuccessPrediction(state);
  const interactions = computeDrugInteractions(state);
  const contraindications = computeContraindications(state);
  const last = latestCheckin(state);
  const nutrientScores = computeNutrientScores(state);
  const topNutrient = nutrientScores.length ? nutrientScores[0] : null;
  const parts: string[] = [];

  if (medNames.length) {
    const medsText = medNames.slice(0, 2).join(', ') + (medNames.length > 2 ? ' and other medications' : '');
    const maxMonths = Math.max(...state.meds.map((x) => Number(x.durationMonths || 0)), 0);
    if (maxMonths > 0) {
      parts.push(
        `You reported taking ${medsText}, with the longest duration currently around ${maxMonths} month${maxMonths === 1 ? '' : 's'}.`,
      );
    } else {
      parts.push(`You reported taking ${medsText}.`);
    }
  } else if (state.symptomOnlyMode) {
    parts.push('You are using GeneoRx in symptom-only mode without medications selected.');
  } else {
    parts.push('You have not added medications yet, so GeneoRx is interpreting your symptoms with limited context.');
  }

  if (symptoms.length) {
    const symText = symptoms.slice(0, 3).join(', ') + (symptoms.length > 3 ? ', and other symptoms' : '');
    parts.push(`Your main reported symptoms are ${symText}, and you rated the overall severity as ${severity}.`);
  } else {
    parts.push('You have not selected current symptoms yet, so GeneoRx is still building your story.');
  }
  if (patterns.length) {
    const p = patterns[0];
    parts.push(`GeneoRx detected a possible pattern: ${p.title.toLowerCase()}. ${p.note}`);
  } else if (topNutrient) {
    parts.push(
      `Based on your current inputs, ${topNutrient[0]} is the strongest support signal GeneoRx sees right now (${topNutrient[1]}%).`,
    );
  } else {
    parts.push('GeneoRx has not detected a strong medication or nutrient pattern yet.');
  }
  if (last) {
    const better = (last.symptoms?.items || []).filter((x) => x.change === 'Much better' || x.change === 'Slightly better').map((x) => x.symptom);
    const worse = (last.symptoms?.items || []).filter((x) => x.change === 'Worse').map((x) => x.symptom);
    if (better.length && !worse.length) {
      parts.push(`Your most recent check-in suggests some improvement, especially in ${better.slice(0, 2).join(' and ')}.`);
    } else if (worse.length) {
      parts.push(`Your most recent check-in suggests ongoing friction, with worsening noted in ${worse.slice(0, 2).join(' and ')}.`);
    } else {
      parts.push('Your most recent check-in shows a mixed picture without a strong improvement or worsening trend yet.');
    }
    parts.push(
      `GeneoRx currently estimates your medication success probability at ${success.score}% (${success.level}).`,
    );
  } else {
    parts.push(
      `You have not logged a weekly check-in yet, so this story is still an early estimate. GeneoRx currently estimates success probability at ${success.score}% (${success.level}).`,
    );
  }
  if (interactions.length || contraindications.length) {
    const bits: string[] = [];
    if (interactions.length) bits.push(`${interactions.length} interaction alert${interactions.length > 1 ? 's' : ''}`);
    if (contraindications.length) bits.push(`${contraindications.length} caution flag${contraindications.length > 1 ? 's' : ''}`);
    parts.push(`GeneoRx also found ${bits.join(' and ')}, which should be part of your next clinician conversation.`);
  }
  if (topNutrient) {
    parts.push(
      `This may be worth discussing with your physician, especially around ${topNutrient[0]} support, lab monitoring, and how your symptom timeline relates to your medication history.`,
    );
  } else {
    parts.push('This may still be worth discussing with your physician, especially if symptoms persist or worsen.');
  }
  return parts.join(' ');
}

export function computePopulationInsights(state: GeneoState): {
  topSymptoms: string[];
  trackedSymptoms: string[];
  checkinCount: number;
  message: string;
} {
  const syms = state.symptoms.selected || [];
  const items = (state.checkins || []).flatMap((c) => c.symptoms?.items || []);
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
    checkinCount: state.checkins.length,
    message: state.checkins.length
      ? 'Based on your check-ins so far, GeneoRx is starting to identify repeat symptom patterns over time.'
      : 'Population-style insights will become stronger once you log check-ins over time.',
  };
}

export function buildRoutineFromSupplements(supps: string[]): {
  morning: string[];
  midday: string[];
  night: string[];
  notes: string[];
} {
  const routine = { morning: [] as string[], midday: [] as string[], night: [] as string[], notes: [] as string[] };
  const s = (supps || []).map((x) => String(x).toLowerCase());
  const hasMg = s.some((x) => x.includes('magnesium'));
  const hasB12 = s.some((x) => x.includes('b12'));
  const hasCoq10 = s.some((x) => x.includes('coq10'));
  const hasD = s.some((x) => x.includes('vitamin d'));
  if (hasB12) routine.morning.push('Methyl B12   morning (often energizing)');
  if (hasD) routine.morning.push('Vitamin D3   with a meal that includes fat');
  if (hasCoq10) routine.midday.push('CoQ10   with lunch (with food)');
  if (hasMg) routine.night.push('Magnesium glycinate   evening/night (often calming)');
  routine.notes.push('If nausea occurs, take supplements with food and reduce dose temporarily.');
  routine.notes.push('Avoid stacking new supplements all at once phase in over 3–7 days.');
  routine.notes.push('Educational only; confirm timing/dose with clinician.');
  return routine;
}

export function latestCheckin(state: GeneoState) {
  if (!state.checkins.length) return null;
  return state.checkins[state.checkins.length - 1];
}

export function computeWeeklyCoachMessage(state: GeneoState): { headline: string; bullets: string[]; nextBestAction: string } {
  const last = latestCheckin(state);
  const base = state.wellbeingBaseline || { energy: 5, mood: 5, sleep: 5, focus: 5 };
  const scores = computeNutrientScores(state);
  const topDriver = scores.length ? `${scores[0][0]} (${scores[0][1]}%)` : ' ';
  if (!last) {
    return {
      headline: 'Your coach is ready.',
      bullets: [
        'Add medications + symptoms to personalize results.',
        'Start your routine to track real improvement over time.',
        'Log a weekly check-in to generate your Health Signal.',
      ],
      nextBestAction: 'Go to Insights → Start routine.',
    };
  }
  const dE = last.wellbeing.energy - base.energy;
  const dM = last.wellbeing.mood - base.mood;
  const dS = last.wellbeing.sleep - base.sleep;
  const dF = last.wellbeing.focus - base.focus;
  const items = last.symptoms?.items || [];
  const best = items.reduce<null | (typeof items)[0]>(
    (acc, x) => (acc === null || (x.changeScore || 0) > (acc.changeScore || 0) ? x : acc),
    null,
  );
  const worst = items.reduce<null | (typeof items)[0]>(
    (acc, x) => (acc === null || (x.changeScore || 0) < (acc.changeScore || 0) ? x : acc),
    null,
  );
  let next = 'Keep the routine consistent for 7 days and log another check-in.';
  if (last.adherencePct < 60) next = 'Try one reminder and aim for 70–80% adherence this week.';
  else if ((worst?.change || '') === 'Worse') next = `Adjust timing/with-food strategy and reassess ${worst?.symptom} next week.`;
  else if (dE <= 0 && dS <= 0) next = 'Try hydration + protein at breakfast for 7 days, then reassess energy/sleep.';
  else if (dE > 0 || dS > 0) next = 'Nice trend keep the same plan for one more week to confirm the signal.';
  return {
    headline:
      dE + dS + dM + dF > 0 ? "You're trending in the right direction." : dE + dS + dM + dF < 0 ? "Let's stabilize this week." : "Let's get a clearer signal.",
    bullets: [
      `Wellbeing deltas: Energy ${dE >= 0 ? '+' : ''}${dE}, Mood ${dM >= 0 ? '+' : ''}${dM}, Sleep ${dS >= 0 ? '+' : ''}${dS}, Focus ${dF >= 0 ? '+' : ''}${dF}.`,
      `Most improved symptom: ${best?.symptom ? `${best.symptom} (${best.change})` : ' '}.`,
      `Least improved symptom: ${worst?.symptom ? `${worst.symptom} (${worst.change})` : ' '}.`,
      `Top driver nutrient: ${topDriver}.`,
    ],
    nextBestAction: next,
  };
}

export function buildClinicianSnapshotText(state: GeneoState, displayEmail: string): string {
  const flags = safetyFlags(state);
  const MED = getMedDb();
  const meds = state.meds.map((m) => {
    const med = MED.find((x) => x.id === m.medId);
    const nm = med ? med.name : m.medId;
    return `- ${nm} • dose: ${m.dose} • duration: ${m.durationMonths || 0} months`;
  });
  const last = latestCheckin(state);
  const scores = computeNutrientScores(state);
  const top = scores
    .slice(0, 6)
    .map(([n, sc]) => `- ${n}: ${tierFromScore(sc)} signal (${sc}%)`);
  const interactions = computeDrugInteractions(state).map((x) => `- ${x.title} (${x.level})`);
  const contraindications = computeContraindications(state).map((x) => `- ${x.title} (${x.level})`);
  const success = computeMedicationSuccessPrediction(state);
  const patterns = detectHealthPatterns(state).map((x) => `- ${x.title} (${x.confidence})`);
  const supp = state.plan.recommendedSupplements || [];
  const adh = last ? `${last.adherencePct}%` : ' ';
  const labs = uniq(scores.slice(0, 5).flatMap(([n]) => LAB_SUGGESTIONS[n] || [])).slice(0, 8);
  const symptoms = state.symptoms.selected.length ? state.symptoms.selected.join(', ') : 'None selected';
  const lastDate = last ? fmtDate(last.dateISO) : ' ';
  return [
    'GENEORX   YOUR DOCTOR VISIT SNAPSHOT',
    '===================================',
    '',
    `Patient: ${displayEmail || 'Anonymous'}   Age: ${state.profile.age || ' '}   Gender: ${state.profile.gender || ' '}`,
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
    labs.length ? labs.map((x) => `- ${x}`).join('\n') : '-  ',
    '',
    `Latest check-in date: ${lastDate}`,
    '',
    'Note: Educational guidance with evidence transparency; confirm labs, dosing, and interactions with your clinician.',
  ].join('\n');
}

export function buildCitationsRegistryForState(state: GeneoState): { all: string[]; pmid: string[]; pmcid: string[]; other: string[] } {
  const claims = claimsForSelectedMeds(state);
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
  for (const tok of all) {
    if (/^PMID:\d+$/i.test(tok)) pmid.push(tok.toUpperCase());
    else if (/^PMCID:PMC\d+$/i.test(tok)) pmcid.push(tok.toUpperCase());
    else other.push(tok);
  }
  pmid.sort();
  pmcid.sort();
  other.sort();
  return { all, pmid, pmcid, other };
}

export function getMedicationName(medId: string): string {
  return getMedDb().find((m) => m.id === medId)?.name || medId;
}

export function getSortedMedsList(): { id: string; name: string }[] {
  return getMedDb()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({ id: m.id, name: m.name }));
}

export function slugifyMedicationName(name: string): string {
  return (
    'custom_' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50)
  );
}

export function addMedicationRow(
  state: GeneoState,
  medId: string,
  dose: string,
  durationMonths: number,
): GeneoState {
  if (!medId) return state;
  if (state.meds.some((x) => x.medId === medId)) return { ...state, symptomOnlyMode: false };
  return {
    ...state,
    symptomOnlyMode: false,
    meds: [...state.meds, { medId, dose, durationMonths: clamp(durationMonths, 0, 360) }],
  };
}

export function removeMedicationAt(state: GeneoState, index: number): GeneoState {
  return { ...state, meds: state.meds.filter((_, i) => i !== index) };
}

export function addOrMergeCustomMed(
  state: GeneoState,
  name: string,
  dose: string,
  durationMonths: number,
): GeneoState {
  const id = slugifyMedicationName(name);
  const catalog: MedDef[] = [...BASE_MED_DB, ...state.customMedCatalog];
  const existing = catalog.find(
    (m) =>
      m.id === id ||
      m.name.toLowerCase() === name.toLowerCase() ||
      m.name.toLowerCase() === `${name.toLowerCase()} (custom)`,
  );
  const useId = existing ? existing.id : id;
  let customMedCatalog = state.customMedCatalog;
  if (!existing) {
    const entry: MedDef = {
      id: useId,
      name: `${name} (custom)`,
      symptomChips: ['Fatigue', 'Dizziness', 'Brain fog', 'GI discomfort', 'Mood changes', 'Sleep changes'],
      claims: [],
    };
    customMedCatalog = [...state.customMedCatalog, entry];
  }
  if (state.meds.some((x) => x.medId === useId)) return { ...state, customMedCatalog };
  return {
    ...state,
    customMedCatalog,
    meds: [...state.meds, { medId: useId, dose, durationMonths: clamp(durationMonths, 0, 360) }],
  };
}