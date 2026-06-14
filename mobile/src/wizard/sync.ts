import type { ProfileResponse, SaveProfilePayload } from '@/types/api';
import type { MedEntry } from '@/content/wizardData';
import type { Dose, WizardCheckin, WizardMed, WizardState } from '@/wizard/types';
import { defaultWizardState } from '@/wizard/types';

export function dedupeCheckins(checkins: WizardCheckin[]): WizardCheckin[] {
  const seen = new Set<string>();
  return (checkins || []).filter((c) => {
    const key = `${c.dateISO}|${c.adherencePct}|${JSON.stringify(c.wellbeing || {})}|${(c.notes || '').trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  return 'med';
}

export function normalizeDoseForApi(dose: Dose): string {
  return dose === 'med' ? 'medium' : dose;
}

export function medsFromApi(medications: ProfileResponse['medications']): WizardMed[] {
  return (medications || []).map((m) => ({
    medId: m.medId,
    dose: normalizeDoseFromApi(String(m.dose || 'medium')),
    durationMonths: m.durationMonths ?? 0,
  }));
}

export function applyProfileToWizard(base: WizardState, data: ProfileResponse): WizardState {
  const next: WizardState = JSON.parse(JSON.stringify(base));
  const ps = (data.portal_state || {}) as Record<string, unknown>;

  if (data.profile) {
    next.profile = {
      age: String(data.profile.age ?? next.profile.age ?? ''),
      gender: data.profile.gender ?? next.profile.gender ?? '',
      pregnant: data.profile.pregnant ?? next.profile.pregnant ?? false,
      kidneyDisease: data.profile.kidneyDisease ?? next.profile.kidneyDisease ?? false,
      anticoagulants: data.profile.anticoagulants ?? next.profile.anticoagulants ?? false,
    };
  }

  const email = data.user?.email || data.account?.email || '';
  if (email && !email.includes('guest@')) next.account.email = email;
  if (typeof data.account?.consent === 'boolean') next.account.consent = data.account.consent;

  if (data.medications?.length) next.meds = medsFromApi(data.medications);
  if (data.symptoms?.length) {
    next.symptoms.selected = data.symptoms.map((s) => s.name);
  }
  if (data.checkins?.length) {
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

export function wizardToSavePayload(state: WizardState, medDb: MedEntry[]): SaveProfilePayload {
  return {
    account: state.account,
    profile: {
      age: state.profile.age,
      gender: state.profile.gender,
      phone: '',
      pregnant: state.profile.pregnant,
      kidneyDisease: state.profile.kidneyDisease,
      anticoagulants: state.profile.anticoagulants,
    },
    medications: state.meds.map((m) => ({
      medId: m.medId,
      dose: normalizeDoseForApi(m.dose),
      durationMonths: m.durationMonths,
    })),
    symptoms: state.symptoms.selected.map((name) => ({ name })),
    plan: state.plan,
    checkins: state.checkins as unknown as SaveProfilePayload['checkins'],
    portal_state: {
      plan: state.plan,
      customMedCatalog: customMedCatalogFromDb(medDb),
      wellbeingBaseline: state.wellbeingBaseline,
      symptomOnlyMode: state.symptomOnlyMode,
      account: { consent: state.account.consent },
      feedback: state.feedback,
      step: state.step,
    },
  };
}

export function wizardToProfileResponse(state: WizardState, user: ProfileResponse['user']): ProfileResponse {
  return {
    user,
    profile: {
      age: state.profile.age,
      gender: state.profile.gender,
      phone: '',
      pregnant: state.profile.pregnant,
      kidneyDisease: state.profile.kidneyDisease,
      anticoagulants: state.profile.anticoagulants,
      medical_history: [],
    },
    account: state.account,
    plan: state.plan,
    portal_state: {
      wellbeingBaseline: state.wellbeingBaseline,
      symptomOnlyMode: state.symptomOnlyMode,
      feedback: state.feedback,
      step: state.step,
    },
    medications: state.meds.map((m) => ({
      medId: m.medId,
      dose: normalizeDoseForApi(m.dose),
      durationMonths: m.durationMonths,
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
      pregnant: payload.profile.pregnant ?? draft.profile.pregnant,
      kidneyDisease: payload.profile.kidneyDisease ?? draft.profile.kidneyDisease,
      anticoagulants: payload.profile.anticoagulants ?? draft.profile.anticoagulants,
    };
  }
  if (payload.medications) draft.meds = medsFromApi(payload.medications);
  if (payload.symptoms) draft.symptoms.selected = payload.symptoms.map((s) => s.name);
  if (payload.checkins) draft.checkins = dedupeCheckins(payload.checkins as unknown as WizardCheckin[]);
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
