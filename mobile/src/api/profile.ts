import { apiRequest } from './client';
import type { ProfileResponse, SaveProfilePayload } from '@/types/api';

export function fetchProfile() {
  return apiRequest<ProfileResponse>('/mobile/profile', { method: 'GET' });
}

export function saveProfile(payload: SaveProfilePayload) {
  return apiRequest<{ success: boolean; message: string }>('/mobile/profile', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Persist the weekly-reminder opt-in. The server merges portal_state, and the
 * check-in cron fans out only to users with reminderPreferences.enabled = true.
 * Sent as a focused portal_state patch so it never touches check-ins/meds.
 */
export function setReminderPreference(enabled: boolean) {
  return apiRequest<{ success: boolean; message: string }>('/mobile/profile', {
    method: 'POST',
    body: { portal_state: { reminderPreferences: { enabled } } },
  });
}
