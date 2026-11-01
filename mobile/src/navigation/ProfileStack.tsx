import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { colors } from '@/theme';

export type ProfileStackParamList = {
  ProfileMain: { edit?: 'personal' | 'health' } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      headerShadowVisible: false,
      headerTitleStyle: { fontSize: 17, fontWeight: '500', color: colors.text },
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
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
