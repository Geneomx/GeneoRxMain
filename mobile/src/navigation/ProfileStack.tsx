import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { colors } from '@/theme';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
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
  </Stack.Navigator>
);
