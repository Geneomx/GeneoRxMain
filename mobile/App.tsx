import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/auth/AuthContext';
import { MedCatalogProvider } from '@/store/MedCatalogContext';
import { ProfileProvider } from '@/store/ProfileContext';
import { WizardProvider } from '@/store/WizardContext';
import { LanguageProvider } from '@/store/LanguageContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ToastProvider } from '@/components/Toast';
import { AppStatusOverlays } from '@/components/AppStatusOverlays';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <MedCatalogProvider>
            <WizardProvider>
              <ProfileProvider>
                <ToastProvider>
                <StatusBar style="light" />
                <RootNavigator />
                <AppStatusOverlays />
                <OnboardingModal />
                </ToastProvider>
              </ProfileProvider>
            </WizardProvider>
          </MedCatalogProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
