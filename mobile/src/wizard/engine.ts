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
import {
  BODY_SYSTEM_KEYS,
  LIFESTYLE_KEYS,
  type BodySystemKey,
  type Dose,
  type Rating,
  type Routine,
  type Severity,
  type TriState,
  type WizardCheckin,
  type WizardState,
} from '@/wizard/types';

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type Tier = 'High' | 'Moderate' | 'Low';
export type AlertLevel = 'High' | 'Moderate' | 'Low';

/**
 * Supplements that warrant a clinician review when the profile flags
 * anticoagulant use. Matched case-insensitively against recommended supplement
 * text in computeContraindications(). Mirrors ANTICOAG_REVIEW_NUTRIENTS in
 * resources/views/include/script.blade.php.
 */
const ANTICOAG_REVIEW_NUTRIENTS = ['coq10', 'vitamin k'];

// Drug-interaction and contraindication rules as DATA, not hardcoded branches.
// Mirrors INTERACTION_RULES / CONTRA_RULES in the web portal
// (resources/views/include/script.blade.php). Adding a medication means adding
// rows here. Each `key` maps to engine.interaction.<key> / engine.contra.<key>
// translation keys.
//
// SAFETY: these are the ONLY interaction/contraindication rules that exist —
// not a substitute for a licensed dataset. Expanding the catalog requires real,
// sourced rules here, never invented ones.
interface InteractionRule {
  meds: string[];
  level: AlertLevel;
  key: string;
}

interface ContraRule {
  condition: 'pregnant' | 'kidneyDisease' | 'anticoagulants';
  anyMed?: string[];
  anySupplementNutrient?: string[];
  level: AlertLevel;
  key: string;
}

const INTERACTION_RULES: InteractionRule[] = [
  { meds: ['metformin', 'omeprazole'], level: 'Moderate', key: 'metformin_omeprazole' },
  { meds: ['lisinopril', 'losartan'], level: 'High', key: 'lisinopril_losartan' },
  { meds: ['amlodipine', 'metoprolol'], level: 'Moderate', key: 'amlodipine_metoprolol' },
];

const CONTRA_RULES: ContraRule[] = [
  { condition: 'pregnant', anyMed: ['lisinopril', 'losartan'], level: 'High', key: 'pregnancy_ace_arb' },
  { condition: 'kidneyDisease', anyMed: ['metformin', 'lisinopril', 'losartan'], level: 'High', key: 'kidney' },
  { condition: 'anticoagulants', anySupplementNutrient: ANTICOAG_REVIEW_NUTRIENTS, level: 'Moderate', key: 'anticoag_supplement' },
];

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

export function computeNutrientScores(s: WizardState, catalog?: MedEntry[]): NutrientScore[] {
  const db = catalog?.length ? catalog : MED_DB;
  const scores: Record<string, number> = {};
  const sevF = severityFactor(s.symptoms.severity);

  for (const mi of s.meds) {
    const med = db.find((x) => x.id === mi.medId);
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

export function claimsForSelectedMeds(s: WizardState, catalog?: MedEntry[]): NutrientClaim[] {
  const db = catalog?.length ? catalog : MED_DB;
  const out: NutrientClaim[] = [];
  for (const mi of s.meds) {
    const med = db.find((x) => x.id === mi.medId);
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

export function evidenceCoverage(s: WizardState, catalog?: MedEntry[]): { selectedCount: number; evidenceCount: number } {
  const db = catalog?.length ? catalog : MED_DB;
  const selected = s.meds.map((m) => m.medId);
  const evidenceCount = selected.filter((id) => {
    const med = db.find((x) => x.id === id);
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

/**
 * Read a check-in's side effects as a list. Mobile used to store this as a raw
 * comma-separated string while the web stored an array, so rows already synced
 * from older app versions come back in either shape — normalise both.
 */
export function sideEffectList(v: string[] | string | null | undefined): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

/* ---------- v3: ratings, body systems, completion ---------- */

/**
 * Normalise anything into a real 0-10 rating or null.
 *
 * `0` is a REAL answer (the user asserted "0/10") and must survive. Everything
 * that is not a finite number — key absent, null, NaN, a string — means the
 * question was not answered and becomes null.
 *
 * Deliberately NOT clampScore()/cl(): those return 0 for a non-number, which
 * would turn every pre-v3 check-in into a flat zero line reading as
 * catastrophic decline. Mirrored in script.blade.php.
 */
export function ratingOrNull(v: unknown): Rating {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return clamp(Math.round(v), 0, 10);
}

/** Only the three literal answers count; anything else is "not answered". */
export function triStateOrNull(v: unknown): TriState | null {
  return v === 'yes' || v === 'no' || v === 'unsure' ? v : null;
}

/**
 * Single read path for all seven systems. The legacy four go through
 * ratingOrNull too, so a corrupt stored value yields null rather than 0.
 */
export function readBodySystems(c: WizardCheckin | null | undefined): Record<BodySystemKey, Rating> {
  const wb = (c?.wellbeing ?? {}) as Record<string, unknown>;
  const out = {} as Record<BodySystemKey, Rating>;
  for (const key of BODY_SYSTEM_KEYS) out[key] = ratingOrNull(wb[key]);
  return out;
}

export interface BodySystemRow {
  key: BodySystemKey;
  value: Rating;
  baseline: Rating;
  /** null unless BOTH value and baseline are real numbers. */
  delta: number | null;
  /** true for the original four, which every user has history for. */
  isLegacy: boolean;
}

export interface BodySystemsView {
  rows: BodySystemRow[];
  answered: number;
  total: number;
  /** Mean of ANSWERED rows only; null when nothing is answered. Never 0. */
  average: number | null;
  checkinDateISO: string | null;
}

const LEGACY_SYSTEMS: BodySystemKey[] = ['energy', 'mood', 'sleep', 'focus'];

export function computeBodySystemsView(
  s: WizardState,
  checkinOverride?: WizardCheckin | null,
): BodySystemsView {
  const checkin = checkinOverride !== undefined ? checkinOverride : latestCheckin(s);
  const values = readBodySystems(checkin);
  const base = readBodySystems({ wellbeing: s.wellbeingBaseline } as WizardCheckin);

  const rows: BodySystemRow[] = BODY_SYSTEM_KEYS.map((key) => {
    const value = values[key];
    const baseline = base[key];
    return {
      key,
      value,
      baseline,
      delta: typeof value === 'number' && typeof baseline === 'number' ? value - baseline : null,
      isLegacy: LEGACY_SYSTEMS.includes(key),
    };
  });

  const answeredValues = rows.map((r) => r.value).filter((v): v is number => typeof v === 'number');
  return {
    rows,
    answered: answeredValues.length,
    total: BODY_SYSTEM_KEYS.length,
    average: answeredValues.length
      ? Math.round((answeredValues.reduce((a, b) => a + b, 0) / answeredValues.length) * 10) / 10
      : null,
    checkinDateISO: checkin?.dateISO ?? null,
  };
}

export interface WeeklyHealthScore {
  score: number | null;
  delta: number | null;
  drivers: { key: string; delta: number }[];
}

/**
 * A composite of things that already exist on every check-in: adherence,
 * wellbeing vs the user's own baseline, and symptom improvement. No new
 * persisted state, no clinical claim — it is a progress signal, not a measure
 * of health.
 */
export function computeWeeklyHealthScore(s: WizardState): WeeklyHealthScore {
  const sorted = [...s.checkins].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const last = sorted[sorted.length - 1] ?? null;
  if (!last) return { score: null, delta: null, drivers: [] };

  const scoreFor = (c: WizardCheckin): number => {
    const adherence = clamp(Math.round(c.adherencePct ?? 0), 0, 100);
    const wb = readBodySystems(c);
    const answered = LEGACY_SYSTEMS.map((k) => wb[k]).filter((v): v is number => typeof v === 'number');
    const wellbeing = answered.length
      ? (answered.reduce((a, b) => a + b, 0) / answered.length) * 10
      : 50;
    const improvement = clamp(50 + (c.symptoms?.improvementScore ?? 0) * 5, 0, 100);
    return Math.round(adherence * 0.4 + wellbeing * 0.4 + improvement * 0.2);
  };

  const score = scoreFor(last);
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const delta = prev ? score - scoreFor(prev) : null;

  const drivers: { key: string; delta: number }[] = [];
  if (prev) {
    const now = readBodySystems(last);
    const before = readBodySystems(prev);
    for (const key of LEGACY_SYSTEMS) {
      const a = now[key];
      const b = before[key];
      if (typeof a === 'number' && typeof b === 'number' && a !== b) {
        drivers.push({ key, delta: a - b });
      }
    }
    drivers.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  }

  return { score, delta, drivers: drivers.slice(0, 3) };
}

export interface LabRecommendation {
  nutrient: string;
  score: number;
  tier: Tier;
  labs: string[];
  /** true when LAB_SUGGESTIONS says no routine test exists — render it, do not hide it. */
  noRoutineLab: boolean;
}

/**
 * Shared by the Labs section and the doctor report so the two cannot drift.
 * Reads LAB_SUGGESTIONS only — adding a lab for a nutrient not in that map
 * would be authoring a test recommendation, which we do not do.
 */
export function buildLabRecommendations(s: WizardState, catalog?: MedEntry[], limit = 5): LabRecommendation[] {
  return computeNutrientScores(s, catalog)
    .slice(0, limit)
    .map(([nutrient, score]) => {
      const labs = LAB_SUGGESTIONS[nutrient] || [];
      const noRoutineLab = labs.length === 0 || labs.some((l) => /no standard|no routine/i.test(l));
      return { nutrient, score, tier: tierFromScore(score), labs, noRoutineLab };
    });
}

export type McsKey = 'adherence' | 'supplements' | 'labs' | 'prescriber' | 'lifestyle';

/**
 * Product judgement, NOT evidence-derived and NOT a validated instrument.
 * Must stay byte-identical to MCS_WEIGHTS in script.blade.php — a parity test
 * asserts it.
 */
export const MCS_WEIGHTS: Record<McsKey, number> = {
  adherence: 0.35,
  supplements: 0.2,
  labs: 0.2,
  prescriber: 0.15,
  lifestyle: 0.1,
};

/** A "completion score" built from one checkbox is a lie of confidence. */
export const MCS_MIN_COMPONENTS = 2;

export interface McsComponent {
  key: McsKey;
  score: number | null;
  weight: number;
  reason: 'answered' | 'not_answered' | 'not_applicable';
  detail?: { taken?: number; planned?: number; yes?: number; asked?: number; dated?: boolean };
}

export interface MedicationCompletion {
  score: number | null;
  components: McsComponent[];
  answered: number;
  total: number;
  coveragePct: number;
  confidence: 'high' | 'moderate' | 'low' | 'none';
  checkinDateISO: string | null;
  /** Constant. Forces every renderer to label the number as self-report. */
  selfReported: true;
}

function triScore(v: TriState | null): { score: number | null; reason: McsComponent['reason'] } {
  const t = triStateOrNull(v);
  if (t === 'yes') return { score: 100, reason: 'answered' };
  if (t === 'no') return { score: 0, reason: 'answered' };
  // 'unsure' and null both mean we do not know — an honest "I don't know" must
  // not be scored as a failure.
  return { score: null, reason: 'not_answered' };
}

/**
 * Returns keys, not prose, and takes no TranslateFn — keeping translated
 * strings out of the part that must stay in lockstep across platforms.
 */
export function computeMedicationCompletion(
  s: WizardState,
  checkinOverride?: WizardCheckin | null,
): MedicationCompletion {
  const checkin = checkinOverride !== undefined ? checkinOverride : latestCheckin(s);
  const isLatest = checkin != null && checkin === latestCheckin(s);
  const completion = checkin?.completion;
  const components: McsComponent[] = [];

  // adherence
  components.push(
    checkin
      ? {
          key: 'adherence',
          score: clamp(Math.round(checkin.adherencePct ?? 0), 0, 100),
          weight: MCS_WEIGHTS.adherence,
          reason: 'answered',
        }
      : { key: 'adherence', score: null, weight: MCS_WEIGHTS.adherence, reason: 'not_applicable' },
  );

  // supplements — planned set must come from the snapshot, or the live plan for
  // the newest check-in only. For older ones the plan may have changed since.
  const planned = checkin?.supplementsPlanned ?? (isLatest ? s.plan.recommendedSupplements : undefined);
  if (checkin && planned && planned.length) {
    const takenSet = new Set(checkin.supplementsTaken || []);
    const taken = planned.filter((x) => takenSet.has(x)).length;
    components.push({
      key: 'supplements',
      score: Math.round((taken / planned.length) * 100),
      weight: MCS_WEIGHTS.supplements,
      reason: 'answered',
      detail: { taken, planned: planned.length },
    });
  } else {
    components.push({ key: 'supplements', score: null, weight: MCS_WEIGHTS.supplements, reason: 'not_applicable' });
  }

  const labs = triScore(completion?.labs ?? null);
  components.push({
    key: 'labs',
    score: labs.score,
    weight: MCS_WEIGHTS.labs,
    reason: labs.reason,
    detail: { dated: Boolean(completion?.labsDateISO) },
  });

  const pres = triScore(completion?.prescriber ?? null);
  components.push({
    key: 'prescriber',
    score: pres.score,
    weight: MCS_WEIGHTS.prescriber,
    reason: pres.reason,
    detail: { dated: Boolean(completion?.prescriberDateISO) },
  });

  // lifestyle — score over the answered sub-questions only
  const life = completion?.lifestyle ?? {};
  let yes = 0;
  let asked = 0;
  for (const key of LIFESTYLE_KEYS) {
    const t = triStateOrNull(life[key]);
    if (t === 'yes') { yes += 1; asked += 1; }
    else if (t === 'no') { asked += 1; }
  }
  components.push(
    asked
      ? {
          key: 'lifestyle',
          score: Math.round((yes / asked) * 100),
          weight: MCS_WEIGHTS.lifestyle,
          reason: 'answered',
          detail: { yes, asked },
        }
      : { key: 'lifestyle', score: null, weight: MCS_WEIGHTS.lifestyle, reason: 'not_answered' },
  );

  const present = components.filter((c) => c.score !== null);
  const hasAdherence = present.some((c) => c.key === 'adherence');
  const total = components.length;
  const answered = present.length;

  let score: number | null = null;
  if (answered >= MCS_MIN_COMPONENTS && hasAdherence) {
    const weightSum = present.reduce((a, c) => a + c.weight, 0);
    // Weights renormalise over what was answered. A missing component is never
    // imputed with the mean of the present ones.
    score = Math.round(present.reduce((a, c) => a + c.weight * (c.score as number), 0) / weightSum);
  }

  const confidence: MedicationCompletion['confidence'] =
    score === null ? 'none' : answered >= 5 ? 'high' : answered >= 3 ? 'moderate' : 'low';

  return {
    score,
    components,
    answered,
    total,
    coveragePct: Math.round((answered / total) * 100),
    confidence,
    checkinDateISO: checkin?.dateISO ?? null,
    selfReported: true,
  };
}

/* ---------- symptoms ---------- */
export function getSymptomUniverse(s: WizardState, catalog?: MedEntry[]): string[] {
  const db = catalog?.length ? catalog : MED_DB;
  const base = s.meds.length
    ? (() => {
        const chips: string[] = [];
        s.meds.forEach((mi) => {
          const med = db.find((x) => x.id === mi.medId);
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

export function tierLabel(tier: Tier | SourceQuality, t: TranslateFn): string {
  const key = `tier.${String(tier).toLowerCase()}`;
  const out = t(key);
  return out !== key ? out : String(tier);
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
  return INTERACTION_RULES.filter((r) => r.meds.every((m) => ids.includes(m))).map((r) => ({
    title: t(`engine.interaction.${r.key}.title`),
    level: r.level,
    note: t(`engine.interaction.${r.key}.note`),
    action: t(`engine.interaction.${r.key}.action`),
  }));
}

export function computeContraindications(s: WizardState, t: TranslateFn): AlertItem[] {
  const ids = s.meds.map((m) => m.medId);
  const supps = s.plan.recommendedSupplements || [];
  // Vitamin K is covered via anySupplementNutrient deliberately: warfarin is the
  // only medication that depletes it, so anyone seeing that recommendation is by
  // definition anticoagulated and must not change vitamin K intake unsupervised.
  return CONTRA_RULES.filter((r) => {
    if (!s.profile[r.condition]) return false;
    const medMatch = r.anyMed ? r.anyMed.some((m) => ids.includes(m)) : false;
    const suppMatch = r.anySupplementNutrient
      ? supps.some((x) => r.anySupplementNutrient!.some((n) => String(x).toLowerCase().includes(n)))
      : false;
    return medMatch || suppMatch;
  }).map((r) => ({
    title: t(`engine.contra.${r.key}.title`),
    level: r.level,
    note: t(`engine.contra.${r.key}.note`),
    action: t(`engine.contra.${r.key}.action`),
  }));
}

/* ---------- predictions / patterns / insight ---------- */
export interface SuccessPrediction {
  score: number;
  level: 'Strong' | 'Moderate' | 'At risk';
  reason: string;
}

export function computeMedicationSuccessPrediction(
  s: WizardState,
  t: TranslateFn,
  checkinOverride?: WizardCheckin | null,
): SuccessPrediction {
  let score = 50;
  if (s.plan.started) score += 10;
  if (s.checkins.length >= 2) score += 10;
  if (s.symptoms.severity === 'severe') score -= 15;
  if (s.symptoms.selected.length >= 4) score -= 10;
  score -= computeDrugInteractions(s, t).length * 8;
  score -= computeContraindications(s, t).length * 10;
  // A report built for an older check-in must score against THAT check-in's
  // adherence, not always today's — otherwise the success line contradicts
  // the adherence figure printed a few lines below it in the same document.
  const last = checkinOverride !== undefined ? checkinOverride : latestCheckin(s);
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

export function computeInsightEngine(s: WizardState, t: TranslateFn, catalog?: MedEntry[]): InsightResult {
  const db = catalog?.length ? catalog : MED_DB;
  const patterns = detectHealthPatterns(s, t);
  const interactions = computeDrugInteractions(s, t);
  const contraindications = computeContraindications(s, t);
  const prediction = computeMedicationSuccessPrediction(s, t);
  const topScore = computeNutrientScores(s, catalog)[0];
  const symptomText = (s.symptoms.selected || []).slice(0, 4).join(', ') || t('engine.insight.no_symptoms');
  const medNames =
    s.meds
      .map((m) => {
        const med = db.find((x) => x.id === m.medId);
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
  // Computed by date rather than trusting array order — dedupeCheckins keeps
  // the array sorted, but this stays correct even if that invariant ever slips.
  return s.checkins.reduce((best, c) =>
    new Date(c.dateISO || 0).getTime() > new Date(best.dateISO || 0).getTime() ? c : best,
  );
}

export interface CoachMessage {
  headline: string;
  bullets: string[];
  nextBestAction: string;
}

export function computeWeeklyCoachMessage(s: WizardState, t: TranslateFn, catalog?: MedEntry[]): CoachMessage {
  const last = latestCheckin(s);
  const base = s.wellbeingBaseline || { energy: 5, mood: 5, sleep: 5, focus: 5 };
  const scores = computeNutrientScores(s, catalog);
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

/**
 * A readable narrative combining meds, symptoms, detected patterns, the most
 * recent check-in trend, safety alerts, and a discussion prompt — ported
 * from the website's generateDynamicHealthStory().
 */
export function generateDynamicHealthStory(
  s: WizardState,
  t: TranslateFn,
  catalog?: MedEntry[],
  checkinOverride?: WizardCheckin | null,
): string {
  const db = catalog?.length ? catalog : MED_DB;
  const medNames = s.meds.map((m) => {
    const med = db.find((x) => x.id === m.medId);
    return med ? med.name : m.medId;
  });
  const symptoms = s.symptoms?.selected || [];
  const severity = s.symptoms?.severity || 'mild';
  const patterns = detectHealthPatterns(s, t);
  const last = checkinOverride !== undefined ? checkinOverride : latestCheckin(s);
  const success = computeMedicationSuccessPrediction(s, t, last);
  const interactions = computeDrugInteractions(s, t);
  const contraindications = computeContraindications(s, t);
  const nutrientScores = computeNutrientScores(s, catalog);
  const topNutrient = nutrientScores.length ? nutrientScores[0] : null;
  const parts: string[] = [];

  if (medNames.length) {
    const medsText = medNames.slice(0, 2).join(', ') + (medNames.length > 2 ? t('summary.story.meds_other') : '');
    const maxMonths = Math.max(...s.meds.map((x) => Number(x.durationMonths || 0)), 0);
    if (maxMonths > 0) {
      parts.push(t('summary.story.meds_duration', { meds: medsText, months: maxMonths }));
    } else {
      parts.push(t('summary.story.meds', { meds: medsText }));
    }
  } else if (s.symptomOnlyMode) {
    parts.push(t('summary.story.symptom_only'));
  } else {
    parts.push(t('summary.story.no_meds'));
  }

  if (symptoms.length) {
    const symText = symptoms.slice(0, 3).join(', ') + (symptoms.length > 3 ? ', and other symptoms' : '');
    parts.push(t('summary.story.symptoms', { symptoms: symText, severity }));
  } else {
    parts.push(t('summary.story.no_symptoms'));
  }

  if (patterns.length) {
    const p = patterns[0];
    parts.push(t('summary.story.pattern', { pattern: p.title.toLowerCase(), note: p.note }));
  } else if (topNutrient) {
    parts.push(t('summary.story.top_nutrient', { nutrient: topNutrient[0], score: topNutrient[1] }));
  } else {
    parts.push(t('summary.story.no_signal'));
  }

  if (last) {
    const better = (last.symptoms?.items || [])
      .filter((x) => x.change === 'Much better' || x.change === 'Slightly better')
      .map((x) => x.symptom);
    const worse = (last.symptoms?.items || []).filter((x) => x.change === 'Worse').map((x) => x.symptom);
    if (better.length && !worse.length) {
      parts.push(t('summary.story.improved', { symptoms: better.slice(0, 2).join(' and ') }));
    } else if (worse.length) {
      parts.push(t('summary.story.worse', { symptoms: worse.slice(0, 2).join(' and ') }));
    } else {
      parts.push(t('summary.story.mixed'));
    }
    parts.push(t('summary.story.success_with_checkin', { score: success.score, level: successLabel(success.level, t) }));
  } else {
    parts.push(t('summary.story.success_no_checkin', { score: success.score, level: successLabel(success.level, t) }));
  }

  if (interactions.length || contraindications.length) {
    const bits: string[] = [];
    if (interactions.length) bits.push(t('summary.story.alert_interactions', { count: interactions.length }));
    if (contraindications.length) bits.push(t('summary.story.alert_cautions', { count: contraindications.length }));
    parts.push(t('summary.story.alerts', { alerts: bits.join(' and ') }));
  }

  if (topNutrient) {
    parts.push(t('summary.story.discuss_nutrient', { nutrient: topNutrient[0] }));
  } else {
    parts.push(t('summary.story.discuss_general'));
  }

  return parts.join(' ');
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
  if (s.checkins.length) {
    const idx =
      typeof checkinIndex === 'number' && checkinIndex >= 0 && checkinIndex < s.checkins.length
        ? checkinIndex
        : s.checkins.length - 1;
    checkin = s.checkins[idx];
  }

  const scores = computeNutrientScores(s, catalog);
  const top = scores.slice(0, 6).map(([n, sc]) => `- ${n}: ${tierLabel(tierFromScore(sc), t)} signal (${sc}%)`);
  const interactions = computeDrugInteractions(s, t).map((x) => `- ${x.title} (${tierLabel(x.level, t)})`);
  const contraindications = computeContraindications(s, t).map((x) => `- ${x.title} (${tierLabel(x.level, t)})`);
  // Score against the SAME check-in the rest of this report is about, not
  // always today's — otherwise this line contradicts the adherence figure
  // printed a few lines below it.
  const success = computeMedicationSuccessPrediction(s, t, checkin);
  const patterns = detectHealthPatterns(s, t).map((x) => `- ${x.title} (${tierLabel(x.confidence, t)})`);

  const supp = s.plan.recommendedSupplements || [];
  const adh = checkin ? `${checkin.adherencePct}%` : '—';
  const labs = uniq(scores.slice(0, 5).flatMap(([n]) => LAB_SUGGESTIONS[n] || [])).slice(0, 8);
  const symptoms = s.symptoms.selected.length ? s.symptoms.selected.join(', ') : t('report.empty.none_selected');
  const lastDate = checkin ? fmtDate(checkin.dateISO) : '—';
  const story = generateDynamicHealthStory(s, t, catalog, checkin);

  const protocolBlock = [
    t('report.protocol_title'),
    supp.length ? supp.map((x) => `- ${x}`).join('\n') : `- ${t('report.empty.no_protocol')}`,
    // Not "latest check-in" — this may be an older, explicitly-selected one;
    // the header above already states which check-in and date this is.
    `${t('report.adherence_label')}: ${adh}`,
  ].join('\n');

  return [
    t('report.title'),
    '===================================',
    '',
    `${t('report.patient_label')}: ${s.account.email || t('report.anonymous')} • ${t('report.age_label')}: ${s.profile.age || '—'} • ${t('report.gender_label')}: ${s.profile.gender || '—'}`,
    `${t('report.safety_flags_label')}: ${flags.length ? flags.join(', ') : t('report.empty.none_reported')}`,
    `${t('report.success_probability_label')}: ${success.score}% (${successLabel(success.level, t)})`,
    '',
    t('report.medications_label'),
    meds.length ? meds.join('\n') : `- ${t('report.empty.none_reported')}`,
    '',
    `${t('report.symptoms_recent_label')}: ${symptoms}`,
    '',
    t('report.detected_patterns_label'),
    patterns.length ? patterns.join('\n') : `- ${t('report.empty.no_patterns')}`,
    '',
    t('report.nutrient_signals_label'),
    top.length ? top.join('\n') : `- ${t('report.empty.no_signals')}`,
    '',
    t('report.drug_interactions_label'),
    interactions.length ? interactions.join('\n') : `- ${t('report.empty.no_interactions')}`,
    '',
    t('report.contraindications_label'),
    contraindications.length ? contraindications.join('\n') : `- ${t('report.empty.no_contraindications')}`,
    '',
    protocolBlock,
    '',
    t('report.optional_labs_label'),
    labs.length ? labs.map((x) => `- ${x}`).join('\n') : '- —',
    '',
    t('report.health_story_label'),
    story,
    '',
    `${t('report.checkin_date_label')}: ${lastDate}`,
    '',
    t('report.footer_note'),
  ].join('\n');
}
