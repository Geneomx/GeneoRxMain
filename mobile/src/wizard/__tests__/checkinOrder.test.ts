import { compareCheckins } from '../checkinOrder';
import { dedupeCheckins } from '../sync';
import { dashboardWeek } from '../dashboardWeek';
import { latestUpdate } from '../latestUpdate';
import { checkinsInRange, trackingHealthStory } from '../reviewData';
import { defaultWizardState, type WizardCheckin } from '../types';
import { translate } from '@/content/i18n';

const now = new Date(2026, 9, 31, 18);
const stamp = new Date(2026, 9, 31, 12).toISOString();
const t = (key: string, vars?: Record<string, string | number | undefined | null>) => translate(key, 'en', vars);
const entry = (id: number, change: 'No change' | 'Slightly better'): WizardCheckin => ({
  id, clientId: `test-${id}`, dateISO: stamp, adherencePct: null, notes: `Record ${id}`,
  supplementsTaken: [], sideEffects: [], wellbeing: { energy: null, mood: null, sleep: null, focus: null },
  symptoms: { items: [{ symptom: 'Headache', change, changeScore: change === 'No change' ? 0 : 1 }] },
});

test('a newest-first API response with identical timestamps stays newest in status, day links and report text', () => {
  const newer = entry(23, 'No change'), older = entry(22, 'Slightly better');
  const apiRecords = [newer, older];
  expect(dedupeCheckins(apiRecords).map(c => c.id)).toEqual([22, 23]);
  expect(checkinsInRange(apiRecords, 'all', now).at(-1)).toBe(newer);
  expect(latestUpdate(apiRecords, t, now).checkin).toBe(newer);
  expect(latestUpdate(apiRecords, t, now).progress).toBe('1 unchanged');
  expect(dashboardWeek(apiRecords, now).at(-1)?.latestIndex).toBe(0);
  const state = { ...defaultWizardState(), checkins: apiRecords };
  expect(trackingHealthStory(state, t)).toContain('Headache: No change');
  expect(trackingHealthStory(state, t)).not.toContain('Headache: Slightly better');
  expect(apiRecords).toEqual([newer, older]);
});

test('pending same-time entries follow saved ones before and after their server ID arrives', () => {
  const saved = entry(22, 'Slightly better');
  const pending = { ...entry(23, 'No change'), id: undefined };
  expect([pending, saved].sort(compareCheckins).at(-1)).toBe(pending);
  expect([entry(23, 'No change'), saved].sort(compareCheckins).at(-1)?.id).toBe(23);
  expect(compareCheckins({ dateISO: stamp, id: '23' }, { dateISO: stamp, id: 22 })).toBeGreaterThan(0);
});

test('actual date/time outranks record ID and unknown-ID ties retain input order', () => {
  const backdated = { ...entry(99, 'No change'), dateISO: new Date(2026, 9, 30, 12).toISOString() };
  const current = entry(22, 'Slightly better');
  expect([current, backdated].sort(compareCheckins).at(-1)).toBe(current);
  const later = { ...current, id: 1, dateISO: new Date(2026, 9, 31, 15).toISOString() };
  expect([later, current].sort(compareCheckins).at(-1)).toBe(later);
  const a = { dateISO: stamp }, b = { dateISO: stamp };
  expect([a, b].sort(compareCheckins)).toEqual([a, b]);
  expect(compareCheckins({ dateISO: 'invalid' }, a)).toBeLessThan(0);
});
