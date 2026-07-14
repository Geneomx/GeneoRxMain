import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { patchInterFont } from '@/theme/interFont';
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
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  // Apply Inter globally once loaded; if the fonts fail, fall back to the
  // system font rather than blocking the app.
  if (fontsLoaded) patchInterFont();
  if (!fontsLoaded && !fontError) return null;

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
