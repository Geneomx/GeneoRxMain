import type { ProfileResponse, SaveProfilePayload } from '@/types/api';
import type { MedEntry } from '@/content/wizardData';
import type { Dose, Wellbeing, WizardCheckin, WizardMed, WizardState } from '@/wizard/types';
import { BODY_SYSTEM_KEYS, defaultWizardState } from '@/wizard/types';
import { compareCheckins } from './checkinOrder';

/**
 * Fill the envelope a check-in reader expects without overwriting anything
 * that was stored. The server now always emits every field, but rows written
 * by older app versions (and local drafts) may lack `symptoms.items`,
 * `wellbeing` keys or `supplementsTaken`, and every reader that dereferences
 * them would crash. A missing rating becomes null, never 0.
 */
export function normalizeCheckin(raw: WizardCheckin): WizardCheckin {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<WizardCheckin>;
  const wellbeing = (c.wellbeing && typeof c.wellbeing === 'object' ? c.wellbeing : {}) as Partial<Wellbeing>;
  const symptoms = (c.symptoms && typeof c.symptoms === 'object' ? c.symptoms : {}) as Partial<WizardCheckin['symptoms']>;
  return {
    ...c,
    dateISO: typeof c.dateISO === 'string' ? c.dateISO : '',
    adherencePct: typeof c.adherencePct === 'number' && Number.isFinite(c.adherencePct) ? c.adherencePct : null,
    medicationDoses: Array.isArray(c.medicationDoses) ? c.medicationDoses : [],
    supplementsTaken: Array.isArray(c.supplementsTaken) ? c.supplementsTaken : [],
    supplementsPlanned: Array.isArray(c.supplementsPlanned) ? c.supplementsPlanned : [],
    symptoms: { ...symptoms, items: Array.isArray(symptoms.items) ? symptoms.items : [] },
    wellbeing: { ...wellbeing, ...Object.fromEntries(BODY_SYSTEM_KEYS.map(key => [key, wellbeing[key] ?? null])) } as Wellbeing,
    // Older mobile builds stored this as a comma-separated string; keep that
    // value (readers go through sideEffectList) and only fill a missing one.
    sideEffects: (Array.isArray(c.sideEffects) || typeof c.sideEffects === 'string' ? c.sideEffects : []) as string[],
    notes: typeof c.notes === 'string' ? c.notes : '',
  };
}

export function dedupeCheckins(checkins: WizardCheckin[]): WizardCheckin[] {
  const seen = new Set<string>();
  const deduped = (checkins || []).map(normalizeCheckin).filter((c) => {
    const key = c.clientId || [
      c.dateISO,
      c.adherencePct,
      JSON.stringify(c.wellbeing || {}),
      (c.notes || '').trim(),
      JSON.stringify(c.supplementsTaken || []),
      JSON.stringify(c.symptoms?.items || []),
      JSON.stringify(c.medicationDoses || []),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Every "latest check-in" lookup elsewhere (reports, progress, the picker)
  // assumes the array is chronological — a backdated local check-in must not
  // silently break that invariant.
  return deduped.sort(compareCheckins);
}

/**
 * Add a check-in from the form, replacing any earlier copy of the same form
 * session (same clientId). A save whose server sync was rejected has already
 * been committed locally; the retry must update that record, not sit beside
 * it as a second one that the server will then also create.
 */
export function upsertCheckin(checkins: WizardCheckin[], checkin: WizardCheckin): WizardCheckin[] {
  const existing = checkin.clientId ? (checkins || []).filter(c => c.clientId === checkin.clientId) : [];
  const rest = (checkins || []).filter(c => !existing.includes(c));
  const id = existing.find(c => c.id != null)?.id;
  return dedupeCheckins([...rest, { ...checkin, ...(id != null && checkin.id == null ? { id } : {}) }]);
}

export function localHasMeaningfulData(s: WizardState | null | undefined): boolean {
  if (!s) return false;
  return !!(
    s.meds?.length ||
    s.symptoms?.selected?.length ||
    s.checkins?.length ||
    s.profile?.age ||
    s.profile?.gender ||
    s.plan?.started ||
    s.account?.consent
  );
}

export function backendResponseHasData(data: ProfileResponse): boolean {
  return !!(
    data.medications?.length ||
    data.symptoms?.length ||
    data.checkins?.length ||
    data.profile?.age ||
    data.profile?.gender
  );
}

export function normalizeDoseFromApi(dose: string): Dose {
  if (dose === 'low') return 'low';
  if (dose === 'high') return 'high';
  if (dose === 'unknown') return 'unknown';
  return 'med';
}

/** Match the server's signature while preserving edits made during a save. */
export function reconcileCheckinIds(state: WizardState, checkins: ProfileResponse['checkins']): WizardState {
  const signature = (c: { clientId?: unknown; dateISO: string; adherencePct: number | null; notes: string }) => typeof c.clientId === 'string' ? c.clientId : `${c.dateISO.slice(0, 10)}|${c.adherencePct}|${c.notes.trim()}`;
  const ids = new Map(checkins.filter(c => c.id != null).map(c => [signature(c), c.id]));
  return { ...state, checkins: state.checkins.map(c => ({ ...c, id: c.id ?? ids.get(signature(c)) })) };
}

export function normalizeDoseForApi(dose: Dose): string {
  return dose === 'med' ? 'medium' : dose;
}

export function medsFromApi(medications: ProfileResponse['medications']): WizardMed[] {
  return (medications || []).map((m) => ({
    medId: m.medId,
    dose: normalizeDoseFromApi(String(m.dose || 'medium')),
    durationMonths: m.durationMonths ?? 0,
    strength: m.strength || '', frequency: m.frequency || '', startDate: m.startDate || '', ...(typeof m.modelInputsConfirmed === 'boolean' ? { modelInputsConfirmed: m.modelInputsConfirmed } : {}),
  }));
}

function readSummaryOverviews(value: object): NonNullable<WizardState['summaryOverview']> {
  const entries = value as Record<string, unknown>;
  return Object.fromEntries(['7', '30', 'all'].filter(key => key in entries).map(key => [key, typeof entries[key] === 'string' ? entries[key].slice(0, 2000) : '']));
}

export function applyProfileToWizard(base: WizardState, data: ProfileResponse): WizardState {
  const next: WizardState = JSON.parse(JSON.stringify(base));
  const ps = (data.portal_state || {}) as Record<string, unknown>;
  if (ps.summaryOverview && typeof ps.summaryOverview === 'object') next.summaryOverview = readSummaryOverviews(ps.summaryOverview);
  if (ps.summaryOverviewBasis && typeof ps.summaryOverviewBasis === 'object') next.summaryOverviewBasis = readSummaryOverviews(ps.summaryOverviewBasis);
  if (ps.reminderPreferences && typeof (ps.reminderPreferences as { enabled?: unknown }).enabled === 'boolean') next.reminderPreferences = ps.reminderPreferences as WizardState['reminderPreferences'];

  if (data.profile) {
    next.profile = {
      age: String(data.profile.age ?? next.profile.age ?? ''),
      gender: data.profile.gender ?? next.profile.gender ?? '',
      phone: data.profile.phone ?? next.profile.phone ?? '',
      pregnant: data.profile.pregnant ?? next.profile.pregnant ?? false,
      kidneyDisease: data.profile.kidneyDisease ?? next.profile.kidneyDisease ?? false,
      anticoagulants: data.profile.anticoagulants ?? next.profile.anticoagulants ?? false,
    };
  }

  const email = data.user?.email || data.account?.email || '';
  if (email && !email.includes('guest@')) next.account.email = email;
  if (typeof data.account?.consent === 'boolean') next.account.consent = data.account.consent;

  if (Array.isArray(data.medications)) next.meds = medsFromApi(data.medications);
  if (Array.isArray(data.symptoms)) {
    next.symptoms.selected = data.symptoms.map((s) => s.name);
  }
  // Custom symptom list + overall severity live in portal_state
  const psSymptoms = ps.symptoms as { custom?: unknown; severity?: unknown; details?: unknown } | undefined;
  if (psSymptoms && typeof psSymptoms === 'object') {
    if (Array.isArray(psSymptoms.custom)) {
      next.symptoms.custom = psSymptoms.custom.map((s) => String(s));
    }
    if ('details' in psSymptoms && psSymptoms.details && typeof psSymptoms.details === 'object') next.symptoms.details = { ...psSymptoms.details as NonNullable<WizardState['symptoms']['details']> };
    if (psSymptoms.severity === 'mild' || psSymptoms.severity === 'moderate' || psSymptoms.severity === 'severe') {
      next.symptoms.severity = psSymptoms.severity;
    }
  }
  if (Array.isArray(data.checkins)) {
    next.checkins = dedupeCheckins(data.checkins as unknown as WizardCheckin[])
      .slice()
      .sort((a, b) => new Date(a.dateISO || 0).getTime() - new Date(b.dateISO || 0).getTime());
  }

  const defaultPlan = defaultWizardState().plan;
  if (ps.plan && typeof ps.plan === 'object') {
    const plan = ps.plan as WizardState['plan'];
    next.plan = {
      ...defaultPlan,
      ...plan,
      routine: { ...defaultPlan.routine, ...(plan.routine || {}) },
    };
  } else if (data.plan && typeof data.plan === 'object') {
    const plan = data.plan as WizardState['plan'];
    next.plan = {
      ...defaultPlan,
      ...plan,
      routine: { ...defaultPlan.routine, ...(plan.routine || {}) },
    };
  }

  if (ps.wellbeingBaseline && typeof ps.wellbeingBaseline === 'object') {
    next.wellbeingBaseline = {
      ...defaultWizardState().wellbeingBaseline,
      ...(ps.wellbeingBaseline as WizardState['wellbeingBaseline']),
    };
  }
  if (typeof ps.symptomOnlyMode === 'boolean') next.symptomOnlyMode = ps.symptomOnlyMode;
  if (Array.isArray(ps.feedback)) next.feedback = ps.feedback as WizardState['feedback'];

  return next;
}

export function mergeBackendIntoWizard(
  current: WizardState,
  data: ProfileResponse,
  localSnapshot: WizardState,
): { state: WizardState; needsBackendPush: boolean } {
  let next = applyProfileToWizard(current, data);

  if (!backendResponseHasData(data) && localHasMeaningfulData(localSnapshot)) {
    next = {
      ...next,
      profile: { ...next.profile, ...localSnapshot.profile },
      meds: localSnapshot.meds || [],
      symptoms: { ...next.symptoms, ...localSnapshot.symptoms },
      checkins: dedupeCheckins(localSnapshot.checkins || []),
      plan: {
        ...defaultWizardState().plan,
        ...localSnapshot.plan,
        routine: {
          ...defaultWizardState().plan.routine,
          ...(localSnapshot.plan?.routine || {}),
        },
      },
      wellbeingBaseline: { ...defaultWizardState().wellbeingBaseline, ...localSnapshot.wellbeingBaseline },
      symptomOnlyMode: localSnapshot.symptomOnlyMode ?? next.symptomOnlyMode,
      feedback: localSnapshot.feedback || next.feedback,
      account: {
        ...next.account,
        consent: typeof localSnapshot.account?.consent === 'boolean'
          ? localSnapshot.account.consent
          : next.account.consent,
        email: data.user?.email && !data.user.email.includes('guest@')
          ? data.user.email
          : localSnapshot.account?.email && !localSnapshot.account.email.includes('guest@')
            ? localSnapshot.account.email
            : next.account.email,
      },
    };
    return { state: next, needsBackendPush: true };
  }

  return { state: next, needsBackendPush: false };
}

export function customMedCatalogFromDb(medDb: MedEntry[]): MedEntry[] {
  return (medDb || []).filter(
    (m) => m?.id && (String(m.id).startsWith('custom_') || String(m.id).includes('custom')),
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function wizardToSavePayload(state: WizardState, medDb: MedEntry[]): SaveProfilePayload {
  // A half-typed email would fail `nullable|email` server-side and 422 the
  // whole autosave — only send it once it is actually a valid address.
  const email = EMAIL_RE.test(state.account.email || '') ? state.account.email : '';
  return {
    account: { ...state.account, email },
    profile: {
      age: state.profile.age,
      gender: state.profile.gender,
      phone: state.profile.phone || '',
      pregnant: state.profile.pregnant,
      kidneyDisease: state.profile.kidneyDisease,
      anticoagulants: state.profile.anticoagulants,
    },
    medications: state.meds.map((m) => ({
      medId: m.medId,
      dose: normalizeDoseForApi(m.dose),
      durationMonths: m.durationMonths,
      strength: m.strength || '', frequency: m.frequency || '', startDate: m.startDate || '', ...(typeof m.modelInputsConfirmed === 'boolean' ? { modelInputsConfirmed: m.modelInputsConfirmed } : {}),
    })),
    symptoms: state.symptoms.selected.map((name) => ({ name })),
    plan: state.plan,
    checkins: state.checkins as unknown as SaveProfilePayload['checkins'],
    portal_state: {
      plan: state.plan,
      customMedCatalog: customMedCatalogFromDb(medDb),
      wellbeingBaseline: state.wellbeingBaseline,
      symptomOnlyMode: state.symptomOnlyMode,
      symptoms: { custom: state.symptoms.custom, severity: state.symptoms.severity, details: state.symptoms.details || {} },
      account: { consent: state.account.consent },
      feedback: state.feedback,
      summaryOverview: state.summaryOverview || {},
      summaryOverviewBasis: state.summaryOverviewBasis || {},
      ...(state.reminderPreferences ? { reminderPreferences: state.reminderPreferences } : {}),
      step: state.step,
    },
  };
}

export function wizardToProfileResponse(state: WizardState, user: ProfileResponse['user']): ProfileResponse {
  return {
    user,
    // Rebuilt from locally stored wizard state, which never carries a doctor
    // identity — that only ever comes from the server.
    doctor: null,
    profile: {
      age: state.profile.age,
      gender: state.profile.gender,
      phone: state.profile.phone || '',
      pregnant: state.profile.pregnant,
      kidneyDisease: state.profile.kidneyDisease,
      anticoagulants: state.profile.anticoagulants,
      medical_history: [],
    },
    account: state.account,
    plan: state.plan,
    portal_state: {
      summaryOverview: state.summaryOverview || {},
      summaryOverviewBasis: state.summaryOverviewBasis || {},
      ...(state.reminderPreferences ? { reminderPreferences: state.reminderPreferences } : {}),
      symptoms: { custom: state.symptoms.custom, severity: state.symptoms.severity, details: state.symptoms.details || {} },
      wellbeingBaseline: state.wellbeingBaseline,
      symptomOnlyMode: state.symptomOnlyMode,
      feedback: state.feedback,
      step: state.step,
    },
    medications: state.meds.map((m) => ({
      medId: m.medId,
      dose: normalizeDoseForApi(m.dose),
      durationMonths: m.durationMonths,
      strength: m.strength || '', frequency: m.frequency || '', startDate: m.startDate || '', ...(typeof m.modelInputsConfirmed === 'boolean' ? { modelInputsConfirmed: m.modelInputsConfirmed } : {}),
    })),
    symptoms: state.symptoms.selected.map((name) => ({ name })),
    checkins: state.checkins as unknown as ProfileResponse['checkins'],
  };
}

export function applySavePayload(draft: WizardState, payload: SaveProfilePayload): void {
  if (payload.account) draft.account = { ...draft.account, ...payload.account };
  if (payload.profile) {
    draft.profile = {
      ...draft.profile,
      age: String(payload.profile.age ?? draft.profile.age),
      gender: payload.profile.gender ?? draft.profile.gender,
      phone: payload.profile.phone ?? draft.profile.phone,
      pregnant: payload.profile.pregnant ?? draft.profile.pregnant,
      kidneyDisease: payload.profile.kidneyDisease ?? draft.profile.kidneyDisease,
      anticoagulants: payload.profile.anticoagulants ?? draft.profile.anticoagulants,
    };
  }
  if (payload.medications) draft.meds = medsFromApi(payload.medications);
  if (payload.symptoms) draft.symptoms.selected = payload.symptoms.map((s) => s.name);
  if (payload.checkins) draft.checkins = dedupeCheckins(payload.checkins as unknown as WizardCheckin[]);
  if (payload.deleted_checkins?.length) {
    const removed = new Set(payload.deleted_checkins.map(String));
    draft.checkins = draft.checkins.filter(c => c.id == null || !removed.has(String(c.id)));
  }
  if (payload.plan) {
    draft.plan = {
      ...defaultWizardState().plan,
      ...(payload.plan as WizardState['plan']),
      routine: {
        ...defaultWizardState().plan.routine,
        ...((payload.plan as WizardState['plan'])?.routine || {}),
      },
    };
  }
  const ps = payload.portal_state || {};
  const symptoms = ps.symptoms as Partial<WizardState['symptoms']> | undefined;
  if (symptoms && typeof symptoms === 'object') {
    if (Array.isArray(symptoms.custom)) draft.symptoms.custom = symptoms.custom.filter((name): name is string => typeof name === 'string');
    if (symptoms.details && typeof symptoms.details === 'object') draft.symptoms.details = { ...symptoms.details };
    if (['mild', 'moderate', 'severe'].includes(symptoms.severity || '')) draft.symptoms.severity = symptoms.severity!;
  }
  if (ps.summaryOverview && typeof ps.summaryOverview === 'object') draft.summaryOverview = readSummaryOverviews(ps.summaryOverview);
  if (ps.summaryOverviewBasis && typeof ps.summaryOverviewBasis === 'object') draft.summaryOverviewBasis = readSummaryOverviews(ps.summaryOverviewBasis);
  if (ps.reminderPreferences && typeof (ps.reminderPreferences as { enabled?: unknown }).enabled === 'boolean') draft.reminderPreferences = ps.reminderPreferences as WizardState['reminderPreferences'];
  if (ps.wellbeingBaseline) {
    draft.wellbeingBaseline = {
      ...draft.wellbeingBaseline,
      ...(ps.wellbeingBaseline as WizardState['wellbeingBaseline']),
    };
  }
  if (typeof ps.symptomOnlyMode === 'boolean') draft.symptomOnlyMode = ps.symptomOnlyMode;
  if (Array.isArray(ps.feedback)) draft.feedback = ps.feedback as WizardState['feedback'];
  if (typeof ps.step === 'number') draft.step = ps.step;
}
