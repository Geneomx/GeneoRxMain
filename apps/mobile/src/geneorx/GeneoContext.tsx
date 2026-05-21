import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api } from '../api';
import { BASE_MED_DB } from './baseData';
import { defaultGeneoState, STORAGE_KEY } from './defaults';
import { mergeFromApi, buildSaveBody, parseLocalState, type ApiProfileResponse } from './sync';
import { configureMedDbResolver } from './medDb';
import type { GeneoState } from './types';

type Ctx = {
  state: GeneoState;
  setState: (u: React.SetStateAction<GeneoState>) => void;
  updateState: (patch: Partial<GeneoState> | ((s: GeneoState) => GeneoState)) => void;
  displayEmail: string;
  setDisplayEmail: (e: string) => void;
  saveNow: () => Promise<void>;
  ready: boolean;
  toast: string | null;
  showToast: (m: string) => void;
  resetLocal: () => void;
};

const GeneoContext = createContext<Ctx | null>(null);

export function GeneoProvider({
  userEmail,
  userName,
  offlineMode = false,
  children,
}: {
  userEmail: string;
  userName: string;
  offlineMode?: boolean;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GeneoState>(defaultGeneoState);
  const [ready, setReady] = useState(false);
  const [displayEmail, setDisplayEmail] = useState(userEmail);
  const [toast, setToast] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  useLayoutEffect(() => {
    configureMedDbResolver(() => [...BASE_MED_DB, ...state.customMedCatalog]);
  }, [state.customMedCatalog]);

  const saveNow = useCallback(async () => {
    const body = buildSaveBody(state);
    if (!offlineMode) {
      try {
        await api('/api/mobile/profile', { method: 'POST', body });
      } catch (e) {
        console.warn('GeneoRx sync (optional):', e);
      }
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('AsyncStorage save:', e);
    }
  }, [offlineMode, state]);

  const debouncedSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveNow();
    }, 450);
  }, [saveNow]);

  useEffect(() => {
    if (!ready) return;
    debouncedSave();
  }, [state, ready, debouncedSave]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        let next = parseLocalState(raw) || defaultGeneoState();
        if (!next.account.email) next = { ...next, account: { ...next.account, email: userEmail } };
        if (!offlineMode) {
          try {
            const data = await api<ApiProfileResponse>('/api/mobile/profile');
            next = mergeFromApi(next, data);
          } catch {
            // offline or error   keep local
          }
        }
        setState(next);
        setDisplayEmail(userEmail || next.account.email);
      } finally {
        setReady(true);
      }
    })();
  }, [offlineMode, userEmail]);

  const updateState: Ctx['updateState'] = useCallback((patch) => {
    setState((s) => (typeof patch === 'function' ? patch(s) : { ...s, ...patch }));
  }, []);

  const resetLocal = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({
      ...defaultGeneoState(),
      account: { email: userEmail, consent: false },
    });
    showToast('Reset ✓');
  }, [userEmail, showToast]);

  const value: Ctx = {
    state,
    setState,
    updateState,
    displayEmail: displayEmail || userName,
    setDisplayEmail,
    saveNow,
    ready,
    toast,
    showToast,
    resetLocal,
  };

  return <GeneoContext.Provider value={value}>{children}</GeneoContext.Provider>;
}

export function useGeneo(): Ctx {
  const c = useContext(GeneoContext);
  if (!c) throw new Error('useGeneo must be used within GeneoProvider');
  return c;
}
