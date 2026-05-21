import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'geneorx_sanctum_token';

function baseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const u = String(raw).replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production' && u.startsWith('http:')) {
    console.warn(
      '[GeneoRx] EXPO_PUBLIC_API_URL should use https in production release builds',
    );
  }
  return u;
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

type FetchOpts = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: object;
  token?: string | null;
  timeoutMs?: number;
};

export async function api<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const token = opts.token ?? (await getToken());
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Could not connect to GeneoRx API. Check that the backend is running.');
    }
    throw new Error('Could not connect to GeneoRx API. Check that the backend is running or set EXPO_PUBLIC_API_URL.');
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(`Invalid response (${res.status}): ${text.slice(0, 200)}`);
    }
  }

  if (!res.ok) {
    const d = data as { message?: string; errors?: unknown } | null;
    const msg =
      d?.message ||
      (d?.errors != null ? JSON.stringify(d.errors) : null) ||
      res.statusText;
    throw new Error(typeof msg === 'string' ? msg : String(msg));
  }

  return data as T;
}

export { baseUrl };
