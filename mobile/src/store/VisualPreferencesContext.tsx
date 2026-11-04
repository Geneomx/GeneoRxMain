import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'geneorx.brand_motion';
const VisualPreferencesContext = createContext({ brandMotion: false, setBrandMotion: async (_value: boolean) => {} });
export const VisualPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandMotion, update] = useState(false);
  useEffect(() => { let active = true; void AsyncStorage.getItem(KEY).then(value => { if (active) update(value === 'true'); }).catch(() => {}); return () => { active = false; }; }, []);
  const setBrandMotion = async (value: boolean) => { await AsyncStorage.setItem(KEY, String(value)); update(value); };
  return <VisualPreferencesContext.Provider value={{ brandMotion, setBrandMotion }}>{children}</VisualPreferencesContext.Provider>;
};
export const useVisualPreferences = () => useContext(VisualPreferencesContext);
