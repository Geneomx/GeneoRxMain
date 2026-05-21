import { apiRequest } from './client';
import type { LoginPayload, LoginResponse, RegisterPayload } from '@/types/api';

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    authenticated: false,
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    authenticated: false,
  });
}

export function logout() {
  return apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' });
}

/** Send a fresh 6-digit OTP to the authenticated user's email. */
export function sendOtp(email: string) {
  return apiRequest<{ ok: boolean; message: string }>('/auth/email-otp/send', {
    method: 'POST',
    body: { email },
  });
}

/** Verify the 6-digit OTP code the user received. */
export function verifyOtp(email: string, code: string) {
  return apiRequest<{ ok: boolean; emailVerified: boolean }>('/auth/email-otp/verify', {
    method: 'POST',
    body: { email, code },
  });
}

/** Request a password reset email. Always resolves (no enumeration). */
export function forgotPassword(email: string) {
  return apiRequest<{ ok: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    authenticated: false,
  });
}

/** Apply a new password using a valid reset token from the deep-link. */
export function resetPassword(token: string, email: string, password: string, passwordConfirmation: string) {
  return apiRequest<{ ok: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, email, password, password_confirmation: passwordConfirmation },
    authenticated: false,
  });
}

// ── Social auth ────────────────────────────────────────────────────────────

/** Same shape as LoginResponse   social login is just a different credential path. */
export type SocialLoginResponse = import('@/types/api').LoginResponse;

/**
 * Sign in with Google.
 * `accessToken` comes from expo-auth-session after the user completes
 * the Google OAuth flow on device.
 */
export function socialGoogle(accessToken: string) {
  return apiRequest<SocialLoginResponse>('/auth/social/google', {
    method: 'POST',
    body: { access_token: accessToken },
    authenticated: false,
  });
}

/**
 * Sign in with Apple.
 * `identityToken` is the JWT from expo-apple-authentication.
 * `email` and `name` are only provided by Apple on the very first sign-in.
 */
export function socialApple(identityToken: string, email?: string | null, name?: string | null) {
  return apiRequest<SocialLoginResponse>('/auth/social/apple', {
    method: 'POST',
    body: { identity_token: identityToken, email, name },
    authenticated: false,
  });
}
