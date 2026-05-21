// Shape mirrors backend payloads from `routes/api.php` and HomeController::getProfile.

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  emailVerified?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Medication {
  id?: number;
  medId: string;
  dose: string;
  durationMonths: number;
}

export interface Symptom {
  id?: number;
  name: string;
}

export interface CheckIn {
  id?: number;
  dateISO: string;
  adherencePct: number;
  notes: string;
  // arbitrary extra payload supported by backend
  [key: string]: unknown;
}

export interface ProfileData {
  age: string | number;
  gender: string;
  phone: string;
  pregnant: boolean;
  kidneyDisease: boolean;
  anticoagulants: boolean;
  medical_history?: string[];
}

export interface AccountData {
  email: string;
  consent: boolean;
}

export interface ProfileResponse {
  user: AuthUser;
  profile: ProfileData | null;
  account: AccountData;
  plan: unknown;
  portal_state: Record<string, unknown>;
  medications: Medication[];
  symptoms: Symptom[];
  checkins: CheckIn[];
}

export interface SaveProfilePayload {
  account?: Partial<AccountData>;
  profile?: Partial<ProfileData>;
  medications?: Medication[];
  symptoms?: Symptom[];
  checkins?: CheckIn[];
  plan?: unknown;
  portal_state?: Record<string, unknown>;
}
