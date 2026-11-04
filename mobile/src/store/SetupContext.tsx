import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createDraftStore } from '@/wizard/draftStore';
import { adjacentSetupStep, needsSetup, readSetupProgress, resumeSetupStep, setupCheckinKey, setupRecord, setupSteps, type SetupProgress, type SetupStep } from '@/wizard/setupFlow';
import type { WizardCheckin, WizardState } from '@/wizard/types';
import { useCheckinDrafts } from './CheckinDraftContext';

type SetupContextValue = {
  ready: boolean;
  pending: boolean;
  active: boolean;
  busy: boolean;
  error: boolean;
  progress: SetupProgress | null;
  steps: readonly SetupStep[];
  begin: (step?: SetupStep) => Promise<boolean>;
  advance: (savedRecord?: WizardCheckin) => Promise<boolean>;
  back: () => Promise<boolean>;
  finish: () => Promise<boolean>;
  pause: () => void;
};
const SetupContext = createContext<SetupContextValue | null>(null);

/** A per-account local navigation bookmark; it contains no health answers. */
export const SetupProvider: React.FC<React.PropsWithChildren<{
  storageKey: string;
  state: WizardState;
  hydrated: boolean;
  isGuest: boolean;
  setStep: (step: number) => void;
  planHubOpen: boolean;
  resetKey: number;
}>> = ({ children, storageKey, state, hydrated, isGuest, setStep, planHubOpen, resetKey }) => {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  const reset = useRef(resetKey);
  const editor = useCheckinDrafts();
  const key = `${storageKey}:setup`;
  const write = useMemo(() => createDraftStore(AsyncStorage, key), [key]);
  const steps = setupSteps(isGuest);

  useEffect(() => {
    let live = true;
    void AsyncStorage.getItem(key).then(raw => {
      let stored: unknown = null;
      try { stored = raw ? JSON.parse(raw) : null; } catch { /* Restart a damaged bookmark, preserving all health records. */ }
      if (live) setProgress(readSetupProgress(stored));
    }).catch(() => { if (live) setError(true); }).finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, [key]);

  useEffect(() => {
    if (reset.current === resetKey) return;
    reset.current = resetKey;
    setActive(false);
    setProgress(null);
    void write(null).catch(() => setError(true));
  }, [resetKey, write]);

  useEffect(() => {
    if (active && (planHubOpen || state.step !== progress?.step)) setActive(false);
  }, [active, planHubOpen, state.step, progress?.step]);

  const move = async (next: SetupProgress): Promise<boolean> => {
    if (!ready || !hydrated || !editor.ready || lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      await write(next);
      setProgress(next);
      if (next.status === 'complete') setActive(false);
      else {
        if (next.step === 5) editor.open(setupRecord(state, next));
        setStep(next.step);
        setActive(true);
      }
      return true;
    } catch { setError(true); return false; }
    finally { lock.current = false; setBusy(false); }
  };

  const begin = (step?: SetupStep) => move({
    ...progress, version: 1, status: 'in-progress',
    step: step !== undefined && steps.includes(step) ? step : resumeSetupStep(state, progress, isGuest),
  });
  const advance = (record?: WizardCheckin) => {
    const next = progress && adjacentSetupStep(progress.step, isGuest, 1);
    return next == null ? Promise.resolve(false) : move({
      ...progress!, step: next, ...(record ? { checkinKey: setupCheckinKey(record) } : {}),
    });
  };
  const back = () => {
    const previous = progress && adjacentSetupStep(progress.step, isGuest, -1);
    return previous == null ? Promise.resolve(false) : move({ ...progress!, step: previous });
  };
  const finish = () => progress ? move({ ...progress, status: 'complete' }) : Promise.resolve(false);
  const sessionReady = ready && hydrated && editor.ready;
  const pending = sessionReady && needsSetup(state, progress);
  return <SetupContext.Provider value={{ ready: sessionReady, pending, active, busy, error, progress, steps, begin, advance, back, finish, pause: () => setActive(false) }}>{children}</SetupContext.Provider>;
};

export function useSetup() {
  const value = useContext(SetupContext);
  if (!value) throw new Error('useSetup must be used inside SetupProvider');
  return value;
}
