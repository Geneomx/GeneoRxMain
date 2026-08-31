/**
 * Expo push-notification registration for the weekly check-in reminders.
 *
 * The server's push pipeline (token table + Sunday cron) already exists; this is
 * the missing device side: request permission, obtain the Expo push token, and
 * register/disable it with the API. Gated by the user's reminder preference so
 * we never prompt for permission unless they've opted in.
 *
 * NOTE: push requires a real build with APNs (iOS) + FCM (Android) credentials
 * on EAS — it does not work in Expo Go on SDK 53+. Everything here degrades
 * gracefully (returns false / no-ops) when unavailable.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerPushToken, deletePushToken } from '@/api/pushToken';

const STORED_TOKEN_KEY = '@geneorx_push_token';

/** Foreground presentation: show reminders as a banner + list entry. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const eas = extra?.eas as { projectId?: string } | undefined;
  return eas?.projectId ?? (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

/**
 * Request permission (if needed), get the Expo push token, and register it with
 * the server. Returns true on success. Safe to call repeatedly.
 */
export async function enablePushNotifications(): Promise<boolean> {
  try {
    if (!Device.isDevice) return false; // simulators can't receive push

    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return false;

    const pid = projectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(pid ? { projectId: pid } : undefined);
    if (!token) return false;

    await registerPushToken(token, Platform.OS);
    await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Silently re-register on app start IF the user previously opted in (a token is
 * stored). Expo tokens can rotate, so we refresh the server's copy. Never
 * prompts for permission — if the user never opted in, this is a no-op.
 */
export async function refreshPushRegistration(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (token) await enablePushNotifications();
  } catch {
    // ignore
  }
}

/** Disable this device's token server-side (on opt-out or sign-out). */
export async function disablePushNotifications(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (token) {
      await deletePushToken(token).catch(() => undefined);
      await AsyncStorage.removeItem(STORED_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}
