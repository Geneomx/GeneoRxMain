/**
 * useSocialAuth   Google + Apple sign-in for native mobile.
 *
 * Google:  uses expo-auth-session to run the OAuth redirect flow, then
 *          sends the access_token to POST /api/auth/social/google for server-side
 *          verification and token issuance.
 *
 * Apple:   uses expo-apple-authentication (iOS only, native dialog) and sends
 *          the identityToken to POST /api/auth/social/apple.
 *
 * Both paths call AuthContext.socialSignIn() which stores the Sanctum token
 * and sets the user   the RootNavigator then switches to AppTabs automatically.
 */

import { useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { socialGoogle, socialApple } from '@/api/auth';
import { useAuth } from '@/auth/AuthContext';

// Required: tells expo-web-browser to close itself after the OAuth redirect.
WebBrowser.maybeCompleteAuthSession();

/** Read client IDs from app.config.ts → app.json extra (or env vars via EAS). */
const GOOGLE_IOS_CLIENT_ID: string | undefined =
  (Constants.expoConfig?.extra as Record<string, unknown>)?.googleIosClientId as string | undefined;
const GOOGLE_ANDROID_CLIENT_ID: string | undefined =
  (Constants.expoConfig?.extra as Record<string, unknown>)?.googleAndroidClientId as string | undefined;
const GOOGLE_WEB_CLIENT_ID: string | undefined =
  (Constants.expoConfig?.extra as Record<string, unknown>)?.googleWebClientId as string | undefined;

export interface SocialAuthHook {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  appleAvailable: boolean;
  loading: boolean;
  error: string | null;
}

export function useSocialAuth(): SocialAuthHook {
  const { socialSignIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apple Sign In is only available on iOS 13+
  const appleAvailable = Platform.OS === 'ios';

  // ── Google OAuth ─────────────────────────────────────────────────────────
  // expo-auth-session/providers/google sets up the full OAuth2 PKCE flow.
  // The hook must be called unconditionally (Rules of Hooks).
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  async function signInWithGoogle(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      const result = await promptGoogleAsync();

      if (result.type !== 'success') {
        // User cancelled or an error occurred   not a fatal error
        if (result.type === 'error') {
          setError('Google sign-in failed. Please try again.');
        }
        return;
      }

      const accessToken = result.authentication?.accessToken;
      if (!accessToken) {
        setError('Google did not return an access token. Please try again.');
        return;
      }

      const res = await socialGoogle(accessToken);
      await socialSignIn(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Apple Sign In ─────────────────────────────────────────────────────────
  async function signInWithApple(): Promise<void> {
    if (!appleAvailable) {
      setError('Sign in with Apple is only available on iOS.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        setError('Apple did not return an identity token. Please try again.');
        return;
      }

      // Build a display name from Apple's fullName object (only on first sign-in)
      const { givenName, familyName } = credential.fullName ?? {};
      const name =
        [givenName, familyName].filter(Boolean).join(' ').trim() || null;

      const res = await socialApple(identityToken, credential.email, name);
      await socialSignIn(res);
    } catch (err: unknown) {
      // ERR_CANCELED means the user dismissed the sheet   not an error to show
      if ((err as { code?: string }).code === 'ERR_CANCELED') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Apple sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { signInWithGoogle, signInWithApple, appleAvailable, loading, error };
}
