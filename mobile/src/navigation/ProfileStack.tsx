import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { DoctorScreen } from '@/screens/DoctorScreen';
import { colors } from '@/theme';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Doctor: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      headerShadowVisible: false,
      headerTitleStyle: { fontSize: 16, fontWeight: '700', color: colors.text },
    }}
  >
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: 'Account settings' }}
    />
    {/* The screen sets its own heading, so the stack header would duplicate it. */}
    <Stack.Screen
      name="Doctor"
      component={DoctorScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
