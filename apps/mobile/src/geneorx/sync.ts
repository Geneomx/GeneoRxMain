import type { CheckinEntry, GeneoState } from './types';
import { defaultGeneoState } from './defaults';

export type PortalStatePayload = {
  plan: GeneoState['plan'];
  customMedCatalog: GeneoState['customMedCatalog'];
  wellbeingBaseline: GeneoState['wellbeingBaseline'];
  symptomOnlyMode: boolean;
  account: { consent: boolean };
  feedback: GeneoState['feedback'];
  reminderPreferences: GeneoState['reminderPreferences'];
};

export type ApiProfileResponse = {
  user: { name: string; email: string; emailVerified?: boolean; email_verified_at?: string | null };
  profile: {
    age: string;
    gender: string;
    phone?: string;
    pregnant: boolean;
    kidneyDisease: boolean;
    anticoagulants: boolean;
  } | null;
  account: { email: string; consent: boolean };
  subscription?: GeneoState['subscription'];
  plan?: GeneoState['plan'];
  portal_state?: Partial<PortalStatePayload> & Record<string, unknown>;
  medications: { id: number; medId: string; dose: string; durationMonths: number }[];
  symptoms: { id: number; name: string }[];
  checkins: (Partial<CheckinEntry> & {
    id: number;
    dateISO: string;
    adherencePct: number;
    notes?: string;
  })[];
};

function isFullCheckin(x: unknown): x is CheckinEntry {
  if (!x || typeof x !== 'object') return false;
  const o = x as CheckinEntry;
  return (
    typeof o.dateISO === 'string' &&
    typeof o.adherencePct === 'number' &&
    Array.isArray(o.supplementsTaken) &&
    o.wellbeing != null &&
    o.symptoms != null &&
    Array.isArray(o.sideEffects) &&
    typeof o.notes === 'string'
  );
}

function normalizeCheckin(
  c: ApiProfileResponse['checkins'][number] | null | undefined,
): CheckinEntry | null {
  if (!c) return null;
  if (isFullCheckin(c)) {
    return c as CheckinEntry;
  }
  return {
    dateISO: c.dateISO,
    adherencePct: c.adherencePct ?? 0,
    supplementsTaken: Array.isArray(c.supplementsTaken) ? c.supplementsTaken : [],
    wellbeing: c.wellbeing || { energy: 5, mood: 5, sleep: 5, focus: 5 },
    symptoms: c.symptoms || { items: [], improvementScore: 0 },
    sideEffects: Array.isArray(c.sideEffects) ? c.sideEffects : [],
    notes: c.notes || '',
  };
}

export function mergeFromApi(prev: GeneoState, data: ApiProfileResponse): GeneoState {
  const p = data.profile;
  const ps = (data.portal_state || {}) as Partial<PortalStatePayload> & Record<string, unknown>;

  const fromApiCheckins = (() => {
    if (!data.checkins || !Array.isArray(data.checkins) || data.checkins.length === 0) {
      return null;
    }
    const list = data.checkins.map((x) => normalizeCheckin(x)).filter((x): x is CheckinEntry => x != null);
    list.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
    return list;
  })();

  const next: GeneoState = {
    ...prev,
    account: {
      email: data.user?.email || data.account?.email || prev.account.email,
      consent: data.account?.consent ?? ps.account?.consent ?? prev.account.consent,
    },
    profile: {
      ...prev.profile,
      age: p ? String(p.age || '') : prev.profile.age,
      gender: p?.gender || prev.profile.gender,
      phone: p?.phone || prev.profile.phone,
      pregnant: p?.pregnant ?? prev.profile.pregnant,
      kidneyDisease: p?.kidneyDisease ?? prev.profile.kidneyDisease,
      anticoagulants: p?.anticoagulants ?? prev.profile.anticoagulants,
    },
    meds: Array.isArray(data.medications)
      ? data.medications.map((m) => ({ medId: m.medId, dose: m.dose, durationMonths: m.durationMonths || 0 }))
      : prev.meds,
    symptoms: {
      ...prev.symptoms,
      selected: Array.isArray(data.symptoms) ? data.symptoms.map((s) => s.name) : prev.symptoms.selected,
    },
    checkins: fromApiCheckins ?? prev.checkins,
    subscription: data.subscription
      ? {
          ...prev.subscription,
          ...data.subscription,
          features: { ...prev.subscription.features, ...(data.subscription.features || {}) },
        }
      : prev.subscription,
  };

  if (Object.keys(ps).length > 0) {
    if (ps.plan != null) next.plan = ps.plan as GeneoState['plan'];
    if (Array.isArray(ps.customMedCatalog)) {
      next.customMedCatalog = ps.customMedCatalog as GeneoState['customMedCatalog'];
    }
    if (ps.wellbeingBaseline != null) {
      next.wellbeingBaseline = ps.wellbeingBaseline as GeneoState['wellbeingBaseline'];
    }
    if (typeof ps.symptomOnlyMode === 'boolean') {
      next.symptomOnlyMode = ps.symptomOnlyMode;
    }
    if (Array.isArray(ps.feedback)) {
      next.feedback = ps.feedback as GeneoState['feedback'];
    }
    if (ps.reminderPreferences && typeof ps.reminderPreferences === 'object') {
      next.reminderPreferences = {
        ...next.reminderPreferences,
        ...(ps.reminderPreferences as Partial<GeneoState['reminderPreferences']>),
      };
    }
  }
  if (data.plan) {
    next.plan = { ...next.plan, ...data.plan } as GeneoState['plan'];
  }
  return next;
}

export function buildSaveBody(state: GeneoState) {
  const portal_state: PortalStatePayload = {
    plan: state.plan,
    customMedCatalog: state.customMedCatalog,
    wellbeingBaseline: state.wellbeingBaseline,
    symptomOnlyMode: state.symptomOnlyMode,
    account: { consent: state.account.consent },
    feedback: state.feedback,
    reminderPreferences: state.reminderPreferences,
  };
  return {
    account: state.account,
    profile: {
      age: state.profile.age,
      gender: state.profile.gender,
      phone: state.profile.phone || '',
      pregnant: state.profile.pregnant,
      kidneyDisease: state.profile.kidneyDisease,
      anticoagulants: state.profile.anticoagulants,
    },
    medications: state.meds,
    symptoms: state.symptoms.selected,
    plan: state.plan,
    portal_state,
    checkins: state.checkins,
  };
}

export function parseLocalState(raw: string | null): GeneoState | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as GeneoState;
    const d = defaultGeneoState();
    return {
      ...d,
      ...o,
      customMedCatalog: o.customMedCatalog || [],
      reminderPreferences: o.reminderPreferences || d.reminderPreferences,
      subscription: o.subscription || d.subscription,
    };
  } catch {
    return null;
  }
}
