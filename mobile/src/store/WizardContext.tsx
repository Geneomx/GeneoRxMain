import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile, saveProfile } from '@/api/profile';
import { useAuth } from '@/auth/AuthContext';
import type { MedEntry } from '@/content/wizardData';
import { normalizeStep } from '@/content/wizardData';
import { loadGuestProfile } from '@/store/guestStore';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { defaultWizardState, type WizardState } from '@/wizard/types';
import {
  applyProfileToWizard,
  applySavePayload,
  backendResponseHasData,
  localHasMeaningfulData,
  mergeBackendIntoWizard,
  wizardToSavePayload,
} from '@/wizard/sync';
import type { SaveProfilePayload } from '@/types/api';
import { emitSyncError } from '@/store/syncEvents';

const STORAGE_KEY = 'geniorx_consumer_portal_v1_split';
const TOTAL_STEPS = 10;
const BACKEND_SAVE_MS = 450;

function clampStep(n: number): number {
  return Math.max(0, Math.min(TOTAL_STEPS - 1, n));
}

interface WizardContextValue {
  state: WizardState;
  hydrated: boolean;
  syncing: boolean;
  update: (mutator: (draft: WizardState) => void) => void;
  setStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  refresh: () => Promise<void>;
  savePayload: (payload: SaveProfilePayload) => Promise<void>;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isGuest, loading: authLoading } = useAuth();
  const { catalog, mergeCustomMeds } = useMedCatalog();
  const [state, setState] = useState<WizardState>(defaultWizardState);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const stateRef = useRef(state);
  const catalogRef = useRef<MedEntry[]>(catalog);
  const backendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  stateRef.current = state;
  catalogRef.current = catalog;

  const persistLocal = useCallback((next: WizardState) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const scheduleBackendSave = useCallback(() => {
    if (isGuest || !token) return;
    if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
    backendTimerRef.current = setTimeout(() => {
      void (async () => {
        setSyncing(true);
        try {
          await saveProfile(wizardToSavePayload(stateRef.current, catalogRef.current));
        } catch {
          emitSyncError();
        } finally {
          setSyncing(false);
        }
      })();
    }, BACKEND_SAVE_MS);
  }, [isGuest, token]);

  const commit = useCallback(
    (next: WizardState) => {
      setState(next);
      persistLocal(next);
      scheduleBackendSave();
    },
    [persistLocal, scheduleBackendSave],
  );

  const loadInitial = useCallback(async () => {
    let local = defaultWizardState();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) local = { ...defaultWizardState(), ...(JSON.parse(raw) as Partial<WizardState>) };
    } catch {
      // ignore
    }

    if (isGuest) {
      try {
        const guest = await loadGuestProfile();
        if (!localHasMeaningfulData(local) && backendResponseHasData(guest)) {
          local = applyProfileToWizard(local, guest);
        }
      } catch {
        // ignore
      }
      local.step = normalizeStep(local.step, true);
      return local;
    }

    if (!token) {
      local.step = normalizeStep(local.step, false);
      return local;
    }

    const snapshot = JSON.parse(JSON.stringify(local)) as WizardState;
    try {
      const data = await fetchProfile();
      const { state: merged, needsBackendPush } = mergeBackendIntoWizard(local, data, snapshot);

      const ps = data.portal_state || {};
      if (Array.isArray(ps.customMedCatalog)) {
        mergeCustomMeds(ps.customMedCatalog as MedEntry[]);
      }

      if (needsBackendPush) {
        persistLocal(merged);
        try {
          await saveProfile(wizardToSavePayload(merged, catalogRef.current));
        } catch {
          emitSyncError();
        }
      }
      merged.step = normalizeStep(merged.step, false);
      return merged;
    } catch {
      emitSyncError();
      local.step = normalizeStep(local.step, false);
      return local;
    }
  }, [isGuest, token, mergeCustomMeds, persistLocal]);

  const refresh = useCallback(async () => {
    if (isGuest || !token) return;
    setSyncing(true);
    try {
      const data = await fetchProfile();
      const snapshot = JSON.parse(JSON.stringify(stateRef.current)) as WizardState;
      const { state: merged } = mergeBackendIntoWizard(stateRef.current, data, snapshot);
      const ps = data.portal_state || {};
      if (Array.isArray(ps.customMedCatalog)) {
        mergeCustomMeds(ps.customMedCatalog as MedEntry[]);
      }
      commit(merged);
    } catch {
      emitSyncError();
    } finally {
      setSyncing(false);
    }
  }, [isGuest, token, commit, mergeCustomMeds]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      const loaded = await loadInitial();
      if (active) {
        setState(loaded);
        setHydrated(true);
      }
    })();
    return () => {
      active = false;
      if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
    };
  }, [loadInitial, authLoading, token, isGuest]);

  const update = useCallback(
    (mutator: (draft: WizardState) => void) => {
      setState((prev) => {
        const draft: WizardState = JSON.parse(JSON.stringify(prev));
        mutator(draft);
        persistLocal(draft);
        scheduleBackendSave();
        return draft;
      });
    },
    [persistLocal, scheduleBackendSave],
  );

  const savePayload = useCallback(
    async (payload: SaveProfilePayload) => {
      const draft: WizardState = JSON.parse(JSON.stringify(stateRef.current));
      applySavePayload(draft, payload);
      commit(draft);
      if (!isGuest && token) {
        setSyncing(true);
        try {
          await saveProfile(wizardToSavePayload(draft, catalogRef.current));
        } catch {
          emitSyncError();
        } finally {
          setSyncing(false);
        }
      }
    },
    [commit, isGuest, token],
  );

  const setStep = useCallback(
    (n: number) => update((d) => { d.step = normalizeStep(clampStep(n), isGuest); }),
    [update, isGuest],
  );
  const next = useCallback(
    () => update((d) => { d.step = normalizeStep(clampStep(d.step + 1), isGuest); }),
    [update, isGuest],
  );
  const prev = useCallback(
    () => update((d) => { d.step = normalizeStep(clampStep(d.step - 1), isGuest); }),
    [update, isGuest],
  );
  const reset = useCallback(() => {
    const fresh = defaultWizardState();
    commit(fresh);
  }, [commit]);

  const value = useMemo<WizardContextValue>(
    () => ({ state, hydrated, syncing, update, setStep, next, prev, reset, refresh, savePayload }),
    [state, hydrated, syncing, update, setStep, next, prev, reset, refresh, savePayload],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within a WizardProvider');
  return ctx;
}
