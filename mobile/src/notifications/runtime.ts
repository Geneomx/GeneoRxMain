import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

// Importing expo-notifications itself initializes remote-push support, which
// throws in Android Expo Go before the app can register its root component.
// Keep that module behind a runtime guard; installed native builds retain it.
export const notifications: typeof import('expo-notifications') | null =
  Platform.OS !== 'web' && !isRunningInExpoGo()
    ? require('expo-notifications')
    : null;

// This choice is fixed for the lifetime of the JS runtime, so hook order stays
// stable while previews without notification support receive no response.
export const useLastNotificationResponse =
  notifications?.useLastNotificationResponse ?? (() => null);
