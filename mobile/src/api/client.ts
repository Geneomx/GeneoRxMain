import Constants from 'expo-constants';
import { getToken } from '@/auth/tokenStorage';

const DEFAULT_BASE_URL = 'https://geneorx.com/api';

export function getApiBaseUrl(): string {
  const fromConfig = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.apiBaseUrl;
  if (typeof fromConfig === 'string' && fromConfig.length > 0) return fromConfig;
  return DEFAULT_BASE_URL;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  authToken?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  authenticated?: boolean;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = true, headers = {}, signal, authToken } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers,
  };

  if (authenticated) {
    const token = authToken ?? await getToken();
    if (token && token !== '__GUEST__') finalHeaders.Authorization = `Bearer ${token}`;
  }

  const url = `${getApiBaseUrl().replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, options.timeoutMs ?? 30_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let parsed: unknown = null;
    let invalidJson = false;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
        invalidJson = true;
      }
    }

    if (response.ok && invalidJson) {
      throw new ApiError(502, null, 'The server returned an unexpected response. Please try again.');
    }

    if (!response.ok) {
      const message =
        (parsed && typeof parsed === 'object' && 'message' in parsed && typeof (parsed as { message: unknown }).message === 'string'
          ? (parsed as { message: string }).message
          : undefined) ?? `Request failed (${response.status})`;
      throw new ApiError(response.status, parsed, message);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError || signal?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new Error('The request took too long. Check your connection and try again.');
    }
    throw new Error('Could not connect. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
