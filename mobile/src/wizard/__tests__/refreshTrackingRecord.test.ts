import { refreshTrackingRecord } from '../refreshTrackingRecord';

function scenario() {
  const state = { dirty: true, revision: 1, active: true };
  const options = {
    pending: () => state.dirty,
    revision: () => state.revision,
    active: () => state.active,
    sync: jest.fn(async (): Promise<'synced' | 'pending'> => 'pending'),
    load: jest.fn(async () => ({ checkins: [] as string[] })),
    apply: jest.fn(async () => undefined),
  };
  return { state, options };
}

test('offline refresh keeps an unsynced first update even when the API is reachable', async () => {
  const { options } = scenario();
  await refreshTrackingRecord(options);
  expect(options.sync).toHaveBeenCalledTimes(1);
  expect(options.load).not.toHaveBeenCalled();
  expect(options.apply).not.toHaveBeenCalled();
});

test('a successful sync permits refresh only after its draft is clean', async () => {
  const { state, options } = scenario();
  options.sync.mockImplementation(async () => { state.dirty = false; return 'synced'; });
  await refreshTrackingRecord(options);
  expect(options.apply).toHaveBeenCalledWith({ checkins: [] });
});

test('an edit while syncing keeps the newer draft', async () => {
  const { state, options } = scenario();
  options.sync.mockImplementation(async () => { state.revision++; return 'synced'; });
  await refreshTrackingRecord(options);
  expect(options.load).not.toHaveBeenCalled();
});

test('an edit arriving during fetch is never replaced by that response', async () => {
  const { state, options } = scenario();
  state.dirty = false;
  options.load.mockImplementation(async () => { state.dirty = true; state.revision++; return { checkins: [] }; });
  await refreshTrackingRecord(options);
  expect(options.apply).not.toHaveBeenCalled();
});

test('a response for a closed account is ignored', async () => {
  const { state, options } = scenario();
  state.dirty = false;
  options.load.mockImplementation(async () => { state.active = false; return { checkins: [] }; });
  await refreshTrackingRecord(options);
  expect(options.apply).not.toHaveBeenCalled();
});
