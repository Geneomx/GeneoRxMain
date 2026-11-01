import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen';
import { colors } from '@/theme';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string; email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      headerShadowVisible: false,
      headerTitleStyle: { fontSize: 17, fontWeight: '500' as const, color: colors.text },
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false, title: 'Sign in' }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false, title: 'Create account' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false, title: 'Forgot password' }} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false, title: 'Reset password' }} />
  </Stack.Navigator>
);
