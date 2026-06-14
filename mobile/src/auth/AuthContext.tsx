import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '@/api/auth';
import { fetchProfile } from '@/api/profile';
import type { SocialLoginResponse } from '@/api/auth';
import { clearToken, getToken, setToken } from './tokenStorage';
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isGuest: boolean;
  emailVerified: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  /** Called with the already-verified SocialLoginResponse from the backend. */
  socialSignIn: (res: SocialLoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  markEmailVerified: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_PLACEHOLDER: AuthUser = { name: '', email: '', emailVerified: true };
const GUEST_USER: AuthUser = { name: 'Guest', email: 'guest@geneorx.local', emailVerified: true };
const GUEST_TOKEN = '__GUEST__';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getToken();
      if (!cancelled) {
        if (stored === GUEST_TOKEN) {
          // Restore a persisted guest session so on-device data survives reload.
          setTokenState(GUEST_TOKEN);
          setUser(GUEST_USER);
          setIsGuest(true);
          setEmailVerified(true);
        } else if (stored) {
          setTokenState(stored);
          setUser(USER_PLACEHOLDER);
          setEmailVerified(true);
          try {
            const data = await fetchProfile();
            if (!cancelled && data.user) {
              setUser(data.user);
              setEmailVerified(true);
            }
          } catch {
            // keep placeholder until profile loads elsewhere
          }
        }
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const res = await apiLogin(payload);
    await setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setIsGuest(false);
    // If they have already verified their email, let them straight in
    setEmailVerified(true);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const res = await apiRegister(payload);
    await setToken(res.token);
    setTokenState(res.token);
    setUser({ ...res.user, emailVerified: true });
    setIsGuest(false);
    setEmailVerified(true);
  }, []);

  /** Used by useSocialAuth after Google/Apple backend verification succeeds. */
  const socialSignIn = useCallback(async (res: SocialLoginResponse) => {
    await setToken(res.token);
    setTokenState(res.token);
    setUser({
      name: res.user.name,
      email: res.user.email,
      emailVerified: res.user.emailVerified,
    });
    setIsGuest(false);
    setEmailVerified(true); // social providers guarantee email ownership
  }, []);

  const signOut = useCallback(async () => {
    if (!isGuest) {
      try {
        await apiLogout();
      } catch {
        // ignore   local sign-out should always succeed
      }
    }
    // Always clear the stored token   the guest token is now persisted too.
    // Guest profile data is intentionally kept so a returning guest resumes
    // where they left off ("Reset app" in Profile is the explicit wipe).
    await clearToken();
    setTokenState(null);
    setUser(null);
    setIsGuest(false);
    setEmailVerified(true); // reset for next login
  }, [isGuest]);

  const continueAsGuest = useCallback(async () => {
    await setToken(GUEST_TOKEN);
    setTokenState(GUEST_TOKEN);
    setUser(GUEST_USER);
    setIsGuest(true);
    setEmailVerified(true);
  }, []);

  const markEmailVerified = useCallback(() => {
    setEmailVerified(true);
    setUser((prev) => (prev ? { ...prev, emailVerified: true } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user, token, loading, isGuest, emailVerified,
      signIn, signUp, socialSignIn, signOut, continueAsGuest, markEmailVerified,
    }),
    [user, token, loading, isGuest, emailVerified, signIn, signUp, socialSignIn, signOut, continueAsGuest, markEmailVerified],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
