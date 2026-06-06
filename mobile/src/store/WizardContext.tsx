import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultWizardState, type WizardState } from '@/wizard/types';

// Mirrors the website portal's localStorage key shape.
const STORAGE_KEY = 'geniorx_consumer_portal_v1_split';
const TOTAL_STEPS = 10;

function clampStep(n: number): number {
  return Math.max(0, Math.min(TOTAL_STEPS - 1, n));
}

interface WizardContextValue {
  state: WizardState;
  hydrated: boolean;
  /** Apply a partial/derived update via an updater function and persist. */
  update: (mutator: (draft: WizardState) => void) => void;
  /** Replace state entirely (used for reset). */
  setStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WizardState>(defaultWizardState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load persisted state once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && raw) {
          const parsed = JSON.parse(raw) as Partial<WizardState>;
          setState({ ...defaultWizardState(), ...parsed });
        }
      } catch {
        // ignore — fall back to default
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: WizardState) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const update = useCallback(
    (mutator: (draft: WizardState) => void) => {
      setState((prev) => {
        // shallow clone is enough since mutator reassigns nested objects/arrays
        const draft: WizardState = JSON.parse(JSON.stringify(prev));
        mutator(draft);
        persist(draft);
        return draft;
      });
    },
    [persist],
  );

  const setStep = useCallback(
    (n: number) => update((d) => { d.step = clampStep(n); }),
    [update],
  );
  const next = useCallback(
    () => update((d) => { d.step = clampStep(d.step + 1); }),
    [update],
  );
  const prev = useCallback(
    () => update((d) => { d.step = clampStep(d.step - 1); }),
    [update],
  );
  const reset = useCallback(() => {
    const fresh = defaultWizardState();
    setState(fresh);
    persist(fresh);
  }, [persist]);

  const value = useMemo<WizardContextValue>(
    () => ({ state, hydrated, update, setStep, next, prev, reset }),
    [state, hydrated, update, setStep, next, prev, reset],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within a WizardProvider');
  return ctx;
}
