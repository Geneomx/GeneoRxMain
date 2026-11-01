import React, { createContext, useContext } from 'react';
import { useFonts } from 'expo-font';

const TypographyContext = createContext(false);

/** Local font assets load without holding the app on its splash screen. */
export const TypographyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [loaded] = useFonts({
    GeneoRxInter400: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    GeneoRxInter500: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    GeneoRxInter600: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  });
  return <TypographyContext.Provider value={loaded}>{children}</TypographyContext.Provider>;
};

export const useAppFontsReady = () => useContext(TypographyContext);
