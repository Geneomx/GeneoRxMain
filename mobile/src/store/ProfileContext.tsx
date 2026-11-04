import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useWizard } from '@/store/WizardContext';
import { emptyGuestProfile } from '@/store/guestStore';
import { wizardToProfileResponse } from '@/wizard/sync';
import type { ProfileResponse, SaveProfilePayload } from '@/types/api';

interface ProfileContextValue {
  data: ProfileResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (payload: SaveProfilePayload) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest, token } = useAuth();
  const { state, hydrated, syncing, serverProfile, refresh, savePayload } = useWizard();

  const data = useMemo<ProfileResponse | null>(() => {
    if (!token) return null;
    const baseUser = user
      ? { name: user.name, email: user.email, emailVerified: user.emailVerified }
      : emptyGuestProfile().user;
    const local = wizardToProfileResponse(state, baseUser);
    return { ...serverProfile, ...local, doctor: serverProfile?.doctor ?? null,
      account: { ...serverProfile?.account, ...local.account },
      portal_state: { ...serverProfile?.portal_state, ...local.portal_state } };
  }, [state, user, token, serverProfile]);

  const refreshProfile = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const save = useCallback(
    async (payload: SaveProfilePayload) => {
      await savePayload(payload);
    },
    [savePayload],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      data,
      loading: !hydrated || syncing,
      error: null,
      refresh: refreshProfile,
      save,
    }),
    [data, hydrated, syncing, refreshProfile, save],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
