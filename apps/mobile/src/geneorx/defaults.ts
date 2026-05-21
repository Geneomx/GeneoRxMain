import type { GeneoState } from './types';

export const STORAGE_KEY = 'geneomx_consumer_portal_v1_split';

export function defaultGeneoState(): GeneoState {
  return {
    step: 0,
    account: { email: '', consent: false },
    profile: {
      age: '',
      gender: '',
      phone: '',
      pregnant: false,
      kidneyDisease: false,
      anticoagulants: false,
    },
    meds: [],
    symptoms: { selected: [], custom: [], severity: 'mild' },
    symptomOnlyMode: false,
    wellbeingBaseline: { energy: 5, mood: 5, sleep: 5, focus: 5 },
    plan: { started: false, startDate: null, recommendedSupplements: [], routine: {} },
    checkins: [],
    feedback: [],
    customMedCatalog: [],
    reminderPreferences: {
      enabled: false,
      day: 'Sunday',
      time: '09:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    subscription: {
      plan: 'free',
      status: 'free',
      isPlus: false,
      isTrialing: false,
      isGrace: false,
      trialEndsAt: null,
      graceEndsAt: null,
      currentPeriodEndsAt: null,
      canceledAt: null,
      features: {
        maxFreeCheckins: 2,
        doctorExport: false,
        pushReminderScheduling: false,
        advancedTrends: false,
        insightHistory: false,
      },
    },
  };
}
