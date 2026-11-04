import { progressComparison, progressPoints } from '../progressChart';
import { checkinsInRange } from '../reviewData';
import type { WizardCheckin } from '../types';
import { defaultWizardState } from '../types';
import { progressExplanationFacts } from '../progressExplanation';

const entry = (dateISO: string, rating?: number, id?: number): WizardCheckin => ({
  dateISO, id, adherencePct: null, supplementsTaken: [], sideEffects: [], notes: '',
  symptoms: { items: [{ symptom: 'Fatigue', change: 'No change', changeScore: 0, severityNow: rating }] },
  wellbeing: { energy: null, mood: null, sleep: null, focus: null },
});
const fatigue = { kind: 'symptom', name: 'Fatigue' } as const;

test('unrated records stay visible and a real zero stays zero', () => {
  const records = [entry('2026-10-28', 5), entry('2026-10-29', 0), entry('2026-10-31')];
  const points = progressPoints(records, fatigue);
  expect(points.map(p => p.value)).toEqual([5, 0, null]);
  const comparison = progressComparison(points);
  expect(comparison.first?.value).toBe(5);
  expect(comparison.last?.record).toBe(records[1]);
  expect(comparison.hasComparison).toBe(true);
});

test('same-day entries remain individually openable in saved order', () => {
  const earlier = entry('2026-10-31', 3, 22), latest = entry('2026-10-31', undefined, 23);
  const input = [latest, earlier];
  const points = progressPoints(input, fatigue);
  expect(points.map(p => p.record)).toEqual([earlier, latest]);
  expect(points[0].record).toBe(earlier);
  expect(points[1].record).toBe(latest);
  expect(new Set(points.map(p => p.key)).size).toBe(2);
  expect(input).toEqual([latest, earlier]);
});

test('missing and invalid ratings are not inferred from symptom changes or earlier answers', () => {
  const points = progressPoints([entry('2026-10-25', NaN), entry('2026-10-26', -1), entry('2026-10-27', 11), entry('2026-10-28'), entry('invalid', 4)], fatigue);
  expect(points.map(p => p.value)).toEqual([null, null, null, null]);
  expect(progressComparison(points)).toEqual({ first: null, last: null, hasComparison: false });
  expect(progressComparison(progressPoints([entry('2026-10-28', 4)], fatigue)).hasComparison).toBe(false);
});

test('a symptom named mood does not use the wellbeing rating', () => {
  const record = entry('2026-10-28');
  record.symptoms.items[0] = { symptom: 'mood', severityNow: 8, change: 'Worse', changeScore: -2 };
  record.wellbeing.mood = 2;
  expect(progressPoints([record], { kind: 'symptom', name: 'mood' })[0].value).toBe(8);
  expect(progressPoints([record], { kind: 'wellbeing', name: 'mood' })[0].value).toBe(2);
});

test('comparison and latest source record respect the selected range', () => {
  const records = [entry('2026-10-01', 9), entry('2026-10-28', 5), entry('2026-10-31'), entry('2026-11-05', 3)];
  const points = progressPoints(checkinsInRange(records, '7', new Date(2026, 10, 2)), fatigue);
  expect(points.map(p => p.record)).toEqual([records[1], records[2]]);
  expect(progressComparison(points).hasComparison).toBe(false);
  expect(points.at(-1)?.record).toBe(records[2]);
});

test('the local explanation follows the selected symptom or wellbeing measure, even with matching names', () => {
  const state = defaultWizardState();
  state.checkins = [entry('2026-10-28', 5), entry('2026-10-29', 3)];
  state.checkins.forEach(record => { record.symptoms.items[0].symptom = 'mood'; record.wellbeing.mood = 2; record.wellbeing.digestive = 4; });
  const now = new Date(2026, 10, 2);
  expect(progressExplanationFacts(state, '7', key => key, [], 'symptom:mood', now).map(f => f.id)).toEqual(['symptom:mood', 'medicines']);
  expect(progressExplanationFacts(state, '7', key => key, [], 'wellbeing:mood', now).map(f => f.id)).toEqual(['wellbeing:mood', 'medicines']);
  expect(progressExplanationFacts(state, '7', key => key, [], 'wellbeing:digestive', now).map(f => f.id)).toEqual(['wellbeing:digestive', 'medicines']);
});
