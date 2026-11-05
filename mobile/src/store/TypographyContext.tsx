import React, { createContext, useContext } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme';
import { useFonts } from 'expo-font';

const TypographyContext = createContext(false);

/** Local font assets load without holding the app on its splash screen. */
export const TypographyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [loaded, fontError] = useFonts({
    GeneoRxSans400: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    GeneoRxSans500: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    GeneoRxSans600: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    GeneoRxSans700: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
    GeneoRxFraunces600: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    GeneoRxFraunces700: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  });
  // Local font files resolve almost instantly; wait for them so every Text renders in the final typeface.
  if (!loaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return <TypographyContext.Provider value={loaded}>{children}</TypographyContext.Provider>;
};

export const useAppFontsReady = () => useContext(TypographyContext);
