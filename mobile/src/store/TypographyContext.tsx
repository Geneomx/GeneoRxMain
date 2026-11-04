import React, { createContext, useContext } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme';
import { useFonts } from 'expo-font';

const TypographyContext = createContext(false);

/** Local font assets load without holding the app on its splash screen. */
export const TypographyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [loaded, fontError] = useFonts({
    GeneoRxSans400: require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
    GeneoRxSans500: require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
    GeneoRxSans600: require('@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf'),
    GeneoRxSans700: require('@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf'),
    GeneoRxFraunces600: require('@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
    GeneoRxFraunces700: require('@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf'),
  });
  // Local font files resolve almost instantly; wait for them so every Text renders in the final typeface.
  if (!loaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return <TypographyContext.Provider value={loaded}>{children}</TypographyContext.Provider>;
};

export const useAppFontsReady = () => useContext(TypographyContext);
