import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/auth/AuthContext';
import { ProfileProvider } from '@/store/ProfileContext';
import { WizardProvider } from '@/store/WizardContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ToastProvider } from '@/components/Toast';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <WizardProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <RootNavigator />
              {/* Onboarding popup — shown once on first launch */}
              <OnboardingModal />
            </ToastProvider>
          </WizardProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
