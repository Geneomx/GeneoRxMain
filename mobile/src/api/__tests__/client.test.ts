jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: { apiBaseUrl: 'http://localhost/api' } } } }));
jest.mock('@/auth/tokenStorage', () => ({ getToken: jest.fn(async () => '__GUEST__') }));

import { apiRequest, ApiError } from '../client';

const fetchMock = jest.fn();
beforeEach(() => { globalThis.fetch = fetchMock as typeof fetch; fetchMock.mockReset(); });
afterEach(() => jest.useRealTimers());

test('native connection failures are explained without Java errors or server URLs', async () => {
  fetchMock.mockRejectedValue(new TypeError('java.io.IOException: unexpected end of stream on http://localhost/private'));
  await expect(apiRequest('/mobile/profile')).rejects.toThrow('Could not connect. Check your connection and try again.');
});

test('a stalled request times out with a retry message', async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('native abort')));
  }));
  const pending = apiRequest('/mobile/profile', { authenticated: false, timeoutMs: 10 });
  const assertion = expect(pending).rejects.toThrow('The request took too long. Check your connection and try again.');
  jest.advanceTimersByTime(11);
  await assertion;
});

test('structured server validation errors remain actionable', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 422, text: async () => JSON.stringify({ message: 'Please enter a valid age.' }) });
  await expect(apiRequest('/mobile/profile')).rejects.toMatchObject({ status: 422, message: 'Please enter a valid age.' });
});

test('a successful HTML response cannot masquerade as a saved profile', async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '<html>Sign in</html>' });
  await expect(apiRequest('/mobile/profile')).rejects.toBeInstanceOf(ApiError);
});

test('guest requests omit authorization and queued account writes use their captured token', async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '{}' });
  await apiRequest('/mobile/ai-summary');
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  await apiRequest('/mobile/profile', { authToken: 'captured-test-session' });
  expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer captured-test-session');
});
