import React from 'react';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

// A tiny stack so VerifyEmail gets a clean navigator context
const VerifyStack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { token, loading, emailVerified, isGuest } = useAuth();

  if (loading) return <Loader />;

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      {/* No token → auth flow */}
      {!token && <AuthStack />}

      {/* Token + unverified email → verify screen (guests are always "verified") */}
      {token && !emailVerified && !isGuest && (
        <VerifyStack.Navigator screenOptions={{ headerShown: false }}>
          <VerifyStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </VerifyStack.Navigator>
      )}

      {/* Token + verified (or guest) → main app */}
      {token && (emailVerified || isGuest) && <AppTabs />}
    </NavigationContainer>
  );
};
