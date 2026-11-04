import { createSaveQueue, wizardStorageKey } from '../session';
import { applyProfileToWizard, applySavePayload, reconcileCheckinIds } from '../sync';
import { defaultWizardState } from '../types';
import type { ProfileResponse } from '@/types/api';

test('health caches are isolated by account, backend and guest mode', () => {
  const a = wizardStorageKey('https://example.test/api', 'a@example.test');
  expect(a).not.toBe(wizardStorageKey('https://example.test/api', 'b@example.test'));
  expect(a).not.toBe(wizardStorageKey('http://localhost/api', 'a@example.test'));
  expect(a).not.toBe(wizardStorageKey('https://example.test/api', 'a@example.test', true));
  expect(a).toBe(wizardStorageKey('https://example.test/api/', ' A@example.test '));
});

test('writes complete in order and a failed save does not block later saves', async () => {
  const queue = createSaveQueue();
  const order: string[] = [];
  let release!: () => void;
  const first = queue(async () => { await new Promise<void>(r => { release = r; }); order.push('older'); });
  const second = queue(async () => { order.push('newer'); });
  await Promise.resolve(); await Promise.resolve();
  expect(order).toEqual([]);
  release(); await Promise.all([first, second]);
  expect(order).toEqual(['older', 'newer']);
  await expect(queue(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  await queue(async () => { order.push('retry'); });
  expect(order).toEqual(['older', 'newer', 'retry']);
});

test('an authoritative empty profile clears removed medications, symptoms and check-ins', () => {
  const local = defaultWizardState();
  local.meds = [{ medId: 'metformin', dose: 'med', durationMonths: 1 }];
  local.symptoms.selected = ['Fatigue'];
  const remote = { user: { name: 'A', email: 'a@example.test' }, profile: null, account: { consent: false, email: 'a@example.test' }, medications: [], symptoms: [], checkins: [], portal_state: {} } as unknown as ProfileResponse;
  const next = applyProfileToWizard(local, remote);
  expect(next.meds).toEqual([]); expect(next.symptoms.selected).toEqual([]); expect(next.checkins).toEqual([]);
});

test('explicit deletion removes a server check-in locally as well', () => {
  const local = defaultWizardState();
  local.checkins = [{ id: 7 }, { id: 8 }] as typeof local.checkins;
  applySavePayload(local, { deleted_checkins: [7] });
  expect(local.checkins.map(c => c.id)).toEqual([8]);
});

test('recover server ids without replacing newer edits or another check-in', () => {
  const local = defaultWizardState();
  local.checkins = [
    { dateISO: '2026-10-18T00:00:00Z', adherencePct: 80, notes: 'Saved entry' },
    { dateISO: '2026-10-19T00:00:00Z', adherencePct: 90, notes: 'New entry while saving' },
  ] as typeof local.checkins;
  local.symptoms.selected = ['New symptom while saving'];
  const result = reconcileCheckinIds(local, [{ id: 14, dateISO: '2026-10-18T00:00:00+00:00', adherencePct: 80, notes: 'Saved entry' }]);
  expect(result.checkins[0].id).toBe(14);
  expect(result.checkins[1].id).toBeUndefined();
  expect(result.checkins[1].notes).toBe('New entry while saving');
  expect(result.symptoms.selected).toEqual(['New symptom while saving']);
});
