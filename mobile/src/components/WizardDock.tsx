import React, { createContext, useContext, useEffect, useRef } from 'react';

export type WizardAction = { title: string; onPress: () => void; loading?: boolean };
export const WizardDockContext = createContext<React.Dispatch<React.SetStateAction<WizardAction | null>> | null>(null);
export const WizardHeaderContext = createContext<React.Dispatch<React.SetStateAction<WizardAction | null>> | null>(null);

export function useWizardHeaderAction(action: WizardAction) {
  const register = useContext(WizardHeaderContext);
  const callback = useRef(action.onPress);
  callback.current = action.onPress;
  useEffect(() => {
    if (!register) return;
    register({ title: action.title, onPress: () => callback.current() });
    return () => register(null);
  }, [register, action.title]);
}

/** Keep the pinned button current without re-registering on every keystroke. */
export function usePinnedWizardAction(action: WizardAction) {
  const register = useContext(WizardDockContext);
  const actionRef = useRef(action.onPress);
  actionRef.current = action.onPress;
  useEffect(() => {
    if (!register) return;
    register({ title: action.title, loading: action.loading, onPress: () => actionRef.current() });
    return () => register(null);
  }, [register, action.title, action.loading]);
  return !!register;
}
