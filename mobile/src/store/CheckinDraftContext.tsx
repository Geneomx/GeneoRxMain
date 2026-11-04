import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDraftStore } from '@/wizard/draftStore';
import { checkinEditorKey, type CheckinFormDraft } from '@/wizard/checkinEditor';
import type { WizardCheckin } from '@/wizard/types';

type Drafts = Record<string, CheckinFormDraft>;
const Context = createContext<{
  ready: boolean; error: boolean; drafts: Drafts; original: WizardCheckin | null; session: number;
  open: (record: WizardCheckin | null) => void;
  put: (key: string, draft: CheckinFormDraft | null) => void;
  finish: () => void;
} | null>(null);

export const CheckinDraftProvider: React.FC<{ storageKey: string; children: React.ReactNode }> = ({ storageKey, children }) => {
  const key = `${storageKey}:unfinished-checkins`;
  const write = useMemo(() => createDraftStore(AsyncStorage, key), [key]);
  const [drafts, setDrafts] = useState<Drafts>({});
  const current = useRef<Drafts>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [original, setOriginal] = useState<WizardCheckin | null>(null);
  const [session, setSession] = useState(0);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(key).then(raw => {
      const value = raw ? JSON.parse(raw) : {};
      if (active) {
        const valid = Object.fromEntries(Object.entries(value).filter(([, d]) => {
          const draft = d as CheckinFormDraft;
          return draft && typeof draft.checkinDate === 'string' && draft.doseEntries && draft.wb && Array.isArray(draft.taken) && Array.isArray(draft.stagedSymptoms);
        })) as Drafts;
        current.current = valid; setDrafts(valid);
      }
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [key]);
  const put = useCallback((draftKey: string, draft: CheckinFormDraft | null) => {
    if (JSON.stringify(current.current[draftKey] || null) === JSON.stringify(draft)) return;
    const next = { ...current.current };
    if (draft) next[draftKey] = draft; else delete next[draftKey];
    current.current = next; setDrafts(next);
    void write(next).then(() => setError(false)).catch(() => setError(true));
  }, [write]);
  const open = useCallback((record: WizardCheckin | null) => { setOriginal(record); setSession(value => value + 1); }, []);
  const finish = useCallback(() => { put(checkinEditorKey(original), null); open(null); }, [original, put, open]);
  return <Context.Provider value={{ ready, error, drafts, original, session, open, put, finish }}>{children}</Context.Provider>;
};

export function useCheckinDrafts() {
  const context = useContext(Context);
  if (!context) throw new Error('CheckinDraftProvider is required');
  return context;
}
