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
 * Reconcile this device's push registration on app start.
 *
 * `accountOptedIn` is the account-level preference from the server. It matters
 * because the preference is per ACCOUNT while the token is per DEVICE: on a
 * second phone, or after a reinstall, the Reminders toggle would read ON
 * (seeded from the account) while this device had no token registered — so the
 * user saw "enabled" and silently never received anything.
 *
 * Registering when the account says opted-in is safe: it only proceeds if the
 * OS permission is already granted, so it never produces a surprise prompt.
 * Passing nothing falls back to the old local-only behaviour.
 */
export async function refreshPushRegistration(accountOptedIn?: boolean): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (token) {
      await enablePushNotifications();
      return;
    }
    if (!accountOptedIn) return;

    // No local token but the account wants reminders. Only register if
    // permission is already granted, so this stays silent.
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') await enablePushNotifications();
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
