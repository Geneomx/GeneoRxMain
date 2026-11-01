import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { createDraftStore } from '@/wizard/draftStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile, saveProfile } from '@/api/profile';
import { useAuth } from '@/auth/AuthContext';
import type { MedEntry } from '@/content/wizardData';
import { normalizeStep } from '@/content/wizardData';
import { useMedCatalog } from '@/store/MedCatalogContext';
import { defaultWizardState, type WizardState } from '@/wizard/types';
import {
  applyProfileToWizard,
  applySavePayload,
  wizardToSavePayload,
} from '@/wizard/sync';
import type { ProfileResponse, SaveProfilePayload } from '@/types/api';
import { emitSyncError } from '@/store/syncEvents';

import { ApiError, getApiBaseUrl } from '@/api/client';
import { createSaveQueue, wizardStorageKey } from '@/wizard/session';
import { reconcileCheckinIds } from '@/wizard/sync';
import { refreshTrackingRecord } from '@/wizard/refreshTrackingRecord';
const TOTAL_STEPS = 10;
const BACKEND_SAVE_MS = 450;

function clampStep(n: number): number {
  return Math.max(0, Math.min(TOTAL_STEPS - 1, n));
}

export type SaveStatus = 'loading' | 'saving' | 'saved' | 'device' | 'pending' | 'error' | 'unavailable';
export type SaveOutcome = 'synced' | 'device' | 'pending';
interface WizardContextValue {
  state: WizardState;
  hydrated: boolean;
  syncing: boolean;
  saveStatus: SaveStatus;
  retrySave: () => Promise<SaveOutcome>;
  serverProfile: ProfileResponse | null;
  update: (mutator: (draft: WizardState) => void) => void;
  setStep: (n: number) => void;
  planHubOpen: boolean;
  openPlanHub: () => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  refresh: () => Promise<void>;
  savePayload: (payload: SaveProfilePayload) => Promise<SaveOutcome>;
  /**
   * Ephemeral (not persisted/synced) — what Results should surface at the top
   * and land the user on, when they arrive from a spot that names something:
   * Home's "See the evidence" / nutrient chip (kind 'nutrient') or the
   * interaction banner (kind 'interaction'). Consumed by ResultsStep on mount.
   */
  focusTarget: FocusTarget | null;
  setFocusTarget: (target: FocusTarget | null) => void;
}

export type FocusTarget =
  | { kind: 'nutrient'; value: string }
  | { kind: 'interaction'; value: string };

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const storageKey = wizardStorageKey(getApiBaseUrl(), user?.email, isGuest);
  // Remount the session when the account changes: no previous patient's state,
  // pending timer or response may become visible in the next account.
  return <WizardSession key={storageKey} storageKey={storageKey}>{children}</WizardSession>;
};

const WizardSession: React.FC<{ storageKey: string; children: React.ReactNode }> = ({ storageKey, children }) => {
  const { token, isGuest, loading: authLoading } = useAuth();
  const { catalog, mergeCustomMeds } = useMedCatalog();
  const [state, setState] = useState<WizardState>(defaultWizardState);
  const [hydrated, setHydrated] = useState(false);
  const [planHubOpen, setPlanHubOpen] = useState(true);
  const openPlanHub = useCallback(() => setPlanHubOpen(true), []);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const { online, ready } = useNetworkStatus();
  const onlineRef = useRef(online);
  onlineRef.current = online;
  const writeDraft = useMemo(() => createDraftStore(AsyncStorage, storageKey), [storageKey]);
  const [syncing, setSyncing] = useState(false);
  const [serverProfile, setServerProfile] = useState<ProfileResponse | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const stateRef = useRef(state);
  const catalogRef = useRef(catalog);
  const active = useRef(true);
  const revision = useRef(0);
  const dirtyRef = useRef(false);
  const accountSnapshotAvailable = useRef(false);
  const pendingDeletes = useRef<Array<string | number>>([]);
  const backendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enqueue = useRef(createSaveQueue()).current;
  catalogRef.current = catalog;

  const persistLocal = useCallback(async (next: WizardState, dirty = true) => {
    const savedRevision = revision.current;
    if (active.current) setSaveStatus('saving');
    try {
      await writeDraft({ state: next, dirty, customMedCatalog: catalogRef.current.filter(med => med.id.startsWith('custom_')), deletedCheckins: [...pendingDeletes.current] });
      if (active.current && revision.current === savedRevision) setSaveStatus(isGuest ? 'device' : dirty ? 'pending' : 'saved');
    } catch (error) {
      if (active.current) setSaveStatus('error');
      throw error;
    }
  }, [writeDraft, isGuest]);

  const sync = useCallback((snapshot: WizardState, intent?: SaveProfilePayload, savedRevision = revision.current): Promise<SaveOutcome> => enqueue(async () => {
    if (!active.current || isGuest || !token) return 'device';
    if (!onlineRef.current) { setSaveStatus('pending'); return 'pending'; }
    setSyncing(true);
    setSaveStatus('saving');
    try {
      const payload = wizardToSavePayload(snapshot, catalogRef.current);
      const deleted = [...new Set([...pendingDeletes.current, ...(intent?.deleted_checkins || [])])];
      if (deleted.length) payload.deleted_checkins = deleted;
      if (intent?.replace_all) payload.replace_all = true;
      await saveProfile(payload, token);
      if (!active.current) return 'synced';
      pendingDeletes.current = pendingDeletes.current.filter(id => !deleted.includes(id));
      const unchanged = revision.current === savedRevision;
      dirtyRef.current = !unchanged;
      let next = stateRef.current;
      try {
        const response = await fetchProfile(undefined, token);
        if (!active.current) return 'synced';
        setServerProfile(response);
        next = reconcileCheckinIds(stateRef.current, response.checkins);
      } catch { next = stateRef.current; /* Keep edits made while id recovery was pending. */ }
      if (!active.current) return 'synced';
      // Re-read the revision after id recovery; a newer edit may have arrived.
      dirtyRef.current = revision.current !== savedRevision;
      stateRef.current = next;
      setState(next);
      await persistLocal(next, dirtyRef.current);
      return 'synced';
    } catch (error) {
      if (active.current) { setSaveStatus(error instanceof ApiError && error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status) ? 'error' : 'pending'); emitSyncError(); }
      throw error;
    } finally {
      if (active.current) setSyncing(false);
    }
  }), [enqueue, isGuest, token, persistLocal]);

  const commit = useCallback((next: WizardState, autosave = true) => {
    // An unreachable first load must never upload an empty replacement profile.
    if (!isGuest && token && !accountSnapshotAvailable.current) {
      setSaveStatus('unavailable');
      return Promise.reject(new Error('Load your account before editing its tracking record.'));
    }
    revision.current += 1;
    dirtyRef.current = true;
    stateRef.current = next;
    setState(next);
    const durable = persistLocal(next);
    if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
    if (autosave && !isGuest && token) {
      backendTimerRef.current = setTimeout(() => { void durable.then(() => sync(stateRef.current)).catch(() => undefined); }, BACKEND_SAVE_MS);
    }
    return durable;
  }, [persistLocal, isGuest, token, sync]);

  const retrySave = useCallback(async (): Promise<SaveOutcome> => {
    if (!isGuest && token && (!accountSnapshotAvailable.current || !dirtyRef.current)) {
      setSaveStatus('loading');
      const before = revision.current;
      let loaded = false;
      try {
        const data = await fetchProfile(undefined, token);
        loaded = true;
        if (!active.current) return 'pending';
        accountSnapshotAvailable.current = true;
        setServerProfile(data);
        if (before !== revision.current || dirtyRef.current) return await sync(stateRef.current);
        const next = applyProfileToWizard(stateRef.current, data);
        stateRef.current = next;
        setState(next);
        await persistLocal(next, false);
        return 'synced';
      } catch (error) { if (active.current && !loaded) setSaveStatus(accountSnapshotAvailable.current ? 'device' : 'unavailable'); throw error; }
    }
    await persistLocal(stateRef.current, dirtyRef.current);
    if (isGuest || !token) return 'device';
    try { return await sync(stateRef.current); } catch { return 'pending'; }
  }, [persistLocal, isGuest, token, sync]);

  useEffect(() => {
    if (authLoading) return;
    active.current = true;
    (async () => {
      let local = defaultWizardState();
      let dirty = false;
      let accountReadFailed = false;
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const cached = JSON.parse(raw);
          local = { ...local, ...cached.state };
          accountSnapshotAvailable.current = !!cached.state;
          if (Array.isArray(cached.customMedCatalog)) { catalogRef.current = [...new Map([...catalogRef.current, ...cached.customMedCatalog].map(med => [med.id, med])).values()]; mergeCustomMeds(cached.customMedCatalog); }
          dirty = cached.dirty === true;
          dirtyRef.current = dirty;
          pendingDeletes.current = Array.isArray(cached.deletedCheckins) ? cached.deletedCheckins : [];
        }
        // The legacy device-wide cache has no reliable owner. Do not import
        // it into a signed-in account or silently upload another user's data.
        if (token && !isGuest) {
          const data = await fetchProfile(undefined, token);
          if (!active.current) return;
          accountSnapshotAvailable.current = true;
          setServerProfile(data);
          if (Array.isArray(data.portal_state?.customMedCatalog)) { const custom = data.portal_state.customMedCatalog as MedEntry[]; catalogRef.current = [...new Map([...catalogRef.current, ...custom].map(med => [med.id, med])).values()]; mergeCustomMeds(custom); }
          if (dirty) {
            local = reconcileCheckinIds(local, data.checkins);
          } else {
            local = applyProfileToWizard(local, data);
          }
        }
      } catch { if (token && !isGuest) { accountReadFailed = true; emitSyncError(); } }
      if (!active.current) return;
      local.step = normalizeStep(local.step, isGuest);
      stateRef.current = local;
      setState(local);
      setHydrated(true);
      if (accountReadFailed && !accountSnapshotAvailable.current) {
        setSaveStatus('unavailable');
      } else {
        void persistLocal(local, dirty).then(() => {
          if (active.current && accountReadFailed && !dirty) setSaveStatus('device');
        }).catch(() => undefined);
      }
      if (dirty && token && !isGuest) void sync(local).catch(() => undefined);
    })();
    return () => {
      active.current = false;
      if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
    };
  }, [authLoading, storageKey, token, isGuest, mergeCustomMeds, sync]);

  const refresh = useCallback(async () => {
    if (isGuest || !token) return;
    if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
    try {
      await refreshTrackingRecord({
        pending: () => dirtyRef.current,
        revision: () => revision.current,
        active: () => active.current,
        sync: () => sync(stateRef.current),
        load: () => fetchProfile(undefined, token),
        apply: async data => {
          accountSnapshotAvailable.current = true;
          setServerProfile(data);
          const next = applyProfileToWizard(stateRef.current, data);
          stateRef.current = next;
          setState(next);
          await persistLocal(next, false);
        },
      });
    } catch { if (!accountSnapshotAvailable.current) setSaveStatus('unavailable'); emitSyncError(); }
  }, [isGuest, token, sync, persistLocal]);

  const update = useCallback((mutator: (draft: WizardState) => void) => {
    const draft = JSON.parse(JSON.stringify(stateRef.current)) as WizardState;
    mutator(draft);
    void commit(draft).catch(() => undefined);
  }, [commit]);

  const savePayload = useCallback(async (payload: SaveProfilePayload) => {
    const draft = JSON.parse(JSON.stringify(stateRef.current)) as WizardState;
    applySavePayload(draft, payload);
    if (payload.deleted_checkins?.length) pendingDeletes.current = [...new Set([...pendingDeletes.current, ...payload.deleted_checkins])];
    await commit(draft, false);
    // A successful local write is usable offline; only cloud sync may be pending.
    try { return await sync(draft, payload); } catch (error) { if (error instanceof ApiError && error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status)) throw error; return 'pending' as const; }
  }, [commit, sync]);

  const setStep = useCallback((n: number) => {
    setPlanHubOpen(false);
    const next = { ...stateRef.current, step: normalizeStep(clampStep(n), isGuest) };
    stateRef.current = next;
    setState(next);
    // Navigation is local UI state, not a health-data edit or a reason to
    // resend a complete profile to the server.
    if (isGuest || !token || accountSnapshotAvailable.current) void persistLocal(next, dirtyRef.current).catch(() => undefined);
  }, [isGuest, token, persistLocal]);
  const next = useCallback(() => setStep(stateRef.current.step + 1), [setStep]);
  const prev = useCallback(() => setStep(stateRef.current.step - 1), [setStep]);
  const reset = useCallback(() => { void commit(defaultWizardState(), false).catch(() => undefined); }, [commit]);
  useEffect(() => {
    if (hydrated && ready && online && dirtyRef.current && !isGuest && token) void sync(stateRef.current).catch(() => undefined);
  }, [hydrated, ready, online, isGuest, token, sync]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', appState => {
      if (appState === 'active' && hydrated && dirtyRef.current) void retrySave().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [hydrated, retrySave]);
  const value = useMemo<WizardContextValue>(() => ({
    state, hydrated, syncing, saveStatus, retrySave, serverProfile, update, setStep, planHubOpen, openPlanHub, next, prev, reset, refresh, savePayload, focusTarget, setFocusTarget,
  }), [state, hydrated, syncing, saveStatus, retrySave, serverProfile, update, setStep, planHubOpen, openPlanHub, next, prev, reset, refresh, savePayload, focusTarget]);
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within a WizardProvider');
  return ctx;
}
