import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE_CODE,
  findLanguage,
  type AppLanguage,
} from '@/content/languages';

const STORAGE_KEY = '@geneorx_language_v1';
const RTL_CODES = new Set(['ar', 'ur']);

function applyRtl(code: string): void {
  const shouldRtl = RTL_CODES.has(code);
  if (I18nManager.isRTL !== shouldRtl) {
    I18nManager.allowRTL(shouldRtl);
    I18nManager.forceRTL(shouldRtl);
  }
}

type LanguageContextValue = {
  language: AppLanguage;
  languages: AppLanguage[];
  setLanguageCode: (code: string) => Promise<void>;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [code, setCode] = useState(DEFAULT_LANGUAGE_CODE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && saved && APP_LANGUAGES.some((l) => l.code === saved)) {
          setCode(saved);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguageCode = useCallback(async (nextCode: string) => {
    const lang = findLanguage(nextCode);
    applyRtl(lang.code);
    setCode(lang.code);
    await AsyncStorage.setItem(STORAGE_KEY, lang.code);
  }, []);

  const value = useMemo(
    () => ({
      language: findLanguage(code),
      languages: APP_LANGUAGES,
      setLanguageCode,
      ready,
    }),
    [code, ready, setLanguageCode],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
