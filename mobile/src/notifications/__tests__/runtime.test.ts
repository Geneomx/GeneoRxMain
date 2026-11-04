import { beforeEach, describe, expect, jest, test } from '@jest/globals';

function loadRuntime(platform: string, expoGo: boolean) {
  const response = { notification: { request: { identifier: 'reminder' } } };
  const nativeHook = jest.fn(() => response);
  const importNotifications = jest.fn(() => ({
    useLastNotificationResponse: nativeHook,
  }));
  jest.doMock('expo', () => ({ isRunningInExpoGo: () => expoGo }));
  jest.doMock('react-native', () => ({ Platform: { OS: platform } }));
  jest.doMock('expo-notifications', importNotifications);

  const runtime: typeof import('../runtime') = require('../runtime');
  return { runtime, importNotifications, nativeHook, response };
}

beforeEach(() => {
  jest.resetModules();
});

describe('notification startup compatibility', () => {
  test.each(['android', 'ios'])('does not import native push support in %s Expo Go', (platform) => {
    const { runtime, importNotifications } = loadRuntime(platform, true);
    expect(importNotifications).not.toHaveBeenCalled();
    expect(runtime.notifications).toBeNull();
    expect(runtime.useLastNotificationResponse()).toBeNull();
  });

  test('does not import native push support on the web', () => {
    const { runtime, importNotifications } = loadRuntime('web', false);
    expect(importNotifications).not.toHaveBeenCalled();
    expect(runtime.notifications).toBeNull();
  });

  test.each(['android', 'ios'])('retains native notification responses in an installed %s build', (platform) => {
    const { runtime, importNotifications, nativeHook, response } = loadRuntime(platform, false);
    expect(importNotifications).toHaveBeenCalledTimes(1);
    expect(runtime.notifications).not.toBeNull();
    expect(runtime.useLastNotificationResponse()).toBe(response);
    expect(nativeHook).toHaveBeenCalledTimes(1);
  });
});
