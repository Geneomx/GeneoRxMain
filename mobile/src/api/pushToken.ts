import { apiRequest } from './client';

/**
 * Register/disable this device's Expo push token with the server. The server
 * (PushTokenController) upserts by token and the weekly check-in cron fans out
 * to every enabled token. Requires an authenticated session.
 */
export function registerPushToken(expoPushToken: string, platform: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/mobile/push-token', {
    method: 'POST',
    body: { expoPushToken, platform },
  });
}

export function deletePushToken(expoPushToken: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/mobile/push-token', {
    method: 'DELETE',
    body: { expoPushToken },
  });
}
