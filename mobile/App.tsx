import React, { useEffect } from 'react';
import { Appearance } from 'react-native';
import { VisualPreferencesProvider } from '@/store/VisualPreferencesContext';
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
import { TypographyProvider } from '@/store/TypographyContext';

export default function App() {
  useEffect(() => { Appearance.setColorScheme('light'); }, []);
  return (
    <SafeAreaProvider><VisualPreferencesProvider><TypographyProvider>
      <AuthProvider>
        <LanguageProvider>
          <MedCatalogProvider>
            <WizardProvider>
              <ProfileProvider>
                <ToastProvider>
                <StatusBar style="dark" />
                <RootNavigator />
                <AppStatusOverlays />
                <OnboardingModal />
                </ToastProvider>
              </ProfileProvider>
            </WizardProvider>
          </MedCatalogProvider>
        </LanguageProvider>
      </AuthProvider>
    </TypographyProvider></VisualPreferencesProvider></SafeAreaProvider>
  );
}
