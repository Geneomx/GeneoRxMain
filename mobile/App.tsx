import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/auth/AuthContext';
import { ProfileProvider } from '@/store/ProfileContext';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
