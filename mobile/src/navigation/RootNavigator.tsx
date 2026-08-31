import React, { useEffect, useRef, useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  LinkingOptions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { refreshPushRegistration } from '@/notifications/push';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { VerifyEmailScreen } from '@/screens/VerifyEmailScreen';
import { Loader } from '@/components/Loader';
import { colors } from '@/theme';

// The check-in step lives at index 5 (CheckinStepScreen) inside the Guided tab.
const CHECKIN_STEP = 5;

// Container-level ref so a notification tap can navigate before any screen mounts.
export const navigationRef = createNavigationContainerRef<ReactNavigation.RootParamList>();

// Deep-link config   geneorx://reset?token=...&email=...
const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['geneorx://'],
  config: {
    screens: {
      // These match the screens in AuthStack
      ResetPassword: {
        path: 'reset',
        parse: {
          token: (v: string) => v,
          email: (v: string) => decodeURIComponent(v),
        },
      },
    },
  },
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

export const RootNavigator: React.FC = () => {
  const { token, loading, isGuest, emailVerified } = useAuth();
  const { setStep } = useWizard();
  const [navReady, setNavReady] = useState(false);
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);

  const isSignedIn = Boolean(token) && !isGuest && emailVerified;

  // Silently refresh this device's push token whenever a signed-in, verified
  // user opens the app. No-op (and no prompt) unless they've opted in before.
  useEffect(() => {
    if (isSignedIn) void refreshPushRegistration();
  }, [isSignedIn]);

  // Route a tapped weekly reminder to the check-in step. Waits for the
  // container (navReady) so it also works on a cold start, and dedupes by the
  // notification id so a stale last-response isn't re-handled every render.
  useEffect(() => {
    if (!lastResponse || !navReady || !isSignedIn) return;
    const id = lastResponse.notification.request.identifier;
    if (handledResponseId.current === id) return;
    handledResponseId.current = id;
    const screen = lastResponse.notification.request.content.data?.screen as string | undefined;
    if (screen === 'checkin' && navigationRef.isReady()) {
      setStep(CHECKIN_STEP);
      navigationRef.navigate('Guided' as never);
    }
  }, [lastResponse, navReady, isSignedIn, setStep]);

  if (loading) return <Loader />;

  // Mirrors the website flow: register → email code verification → portal.
  const needsVerification = Boolean(token) && !isGuest && !emailVerified;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      linking={linking}
      onReady={() => setNavReady(true)}
    >
      {!token ? <AuthStack /> : needsVerification ? <VerifyEmailScreen /> : <AppTabs />}
    </NavigationContainer>
  );
};
