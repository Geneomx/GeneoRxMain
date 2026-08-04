import React from 'react';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { useAuth } from '@/auth/AuthContext';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { VerifyEmailScreen } from '@/screens/VerifyEmailScreen';
import { Loader } from '@/components/Loader';
import { colors } from '@/theme';

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

  if (loading) return <Loader />;

  // Mirrors the website flow: register → email code verification → portal.
  const needsVerification = Boolean(token) && !isGuest && !emailVerified;

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      {!token ? <AuthStack /> : needsVerification ? <VerifyEmailScreen /> : <AppTabs />}
    </NavigationContainer>
  );
};
