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
