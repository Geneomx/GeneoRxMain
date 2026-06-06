import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileData, ProfileResponse, SaveProfilePayload } from '@/types/api';

// Local, on-device persistence for guest mode (no backend account).
const KEY = 'geneorx.guest.profile';

const DEFAULT_PROFILE: ProfileData = {
  age: '',
  gender: '',
  phone: '',
  pregnant: false,
  kidneyDisease: false,
  anticoagulants: false,
  medical_history: [],
};

export function emptyGuestProfile(): ProfileResponse {
  return {
    user: { name: 'Guest', email: 'guest@geneorx.local', emailVerified: true },
    profile: null,
    account: { email: 'guest@geneorx.local', consent: false },
    plan: null,
    portal_state: {},
    medications: [],
    symptoms: [],
    checkins: [],
  };
}

export async function loadGuestProfile(): Promise<ProfileResponse> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyGuestProfile();
    const parsed = JSON.parse(raw) as Partial<ProfileResponse>;
    return { ...emptyGuestProfile(), ...parsed };
  } catch {
    return emptyGuestProfile();
  }
}

/** Merge a partial save payload into the existing guest profile and persist it. */
export async function saveGuestProfile(
  base: ProfileResponse,
  payload: SaveProfilePayload,
): Promise<ProfileResponse> {
  const next: ProfileResponse = {
    ...base,
    account: payload.account ? { ...base.account, ...payload.account } : base.account,
    profile: payload.profile
      ? { ...DEFAULT_PROFILE, ...(base.profile ?? {}), ...payload.profile }
      : base.profile,
    medications: payload.medications ?? base.medications,
    symptoms: payload.symptoms ?? base.symptoms,
    checkins: payload.checkins ?? base.checkins,
    plan: payload.plan ?? base.plan,
    portal_state: payload.portal_state ?? base.portal_state,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearGuestProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
