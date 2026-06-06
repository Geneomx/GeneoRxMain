import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProfile, saveProfile } from '@/api/profile';
import { useAuth } from '@/auth/AuthContext';
import { loadGuestProfile, saveGuestProfile } from '@/store/guestStore';
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
  const { token, isGuest } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep the latest data available to save() without re-creating the callback.
  const dataRef = useRef<ProfileResponse | null>(null);
  dataRef.current = data;

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Guest mode persists entirely on-device   no backend account.
      const res = isGuest ? await loadGuestProfile() : await fetchProfile();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [token, isGuest]);

  const save = useCallback(
    async (payload: SaveProfilePayload) => {
      if (isGuest) {
        const base = dataRef.current ?? (await loadGuestProfile());
        const next = await saveGuestProfile(base, payload);
        setData(next);
        return;
      }
      await saveProfile(payload);
      await refresh();
    },
    [isGuest, refresh],
  );

  useEffect(() => {
    if (token) refresh();
    else setData(null);
  }, [token, refresh]);

  const value = useMemo(
    () => ({ data, loading, error, refresh, save }),
    [data, loading, error, refresh, save],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
