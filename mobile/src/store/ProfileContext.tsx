import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfile, saveProfile } from '@/api/profile';
import { useAuth } from '@/auth/AuthContext';
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
  const { token } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProfile();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const save = useCallback(
    async (payload: SaveProfilePayload) => {
      await saveProfile(payload);
      await refresh();
    },
    [refresh],
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
