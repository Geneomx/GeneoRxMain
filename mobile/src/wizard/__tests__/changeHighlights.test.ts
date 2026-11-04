import { symptomHighlights } from '../trends';
import type { CheckinSymptomItem } from '../types';

const item = (symptom: string, changeScore: number): CheckinSymptomItem => ({ symptom, changeScore, change: changeScore > 0 ? 'Slightly better' : changeScore < 0 ? 'Worse' : 'No change' });

test('unchanged symptoms are not described as improvement or worsening', () => {
  expect(symptomHighlights([item('Fatigue', 0), item('Headache', 0)])).toEqual({ improved: null, worsened: null });
});

test('improvement and worsening are independent, without manufacturing the opposite direction', () => {
  expect(symptomHighlights([item('Fatigue', 1)]).worsened).toBeNull();
  expect(symptomHighlights([item('Headache', -2)]).improved).toBeNull();
});

test('highlights retain the strongest reported changes without mutating history', () => {
  const items = [item('A', 1), item('B', -1), item('C', 2), item('D', -2)];
  const result = symptomHighlights(items);
  expect(result.improved?.symptom).toBe('C');
  expect(result.worsened?.symptom).toBe('D');
  expect(items.map(i => i.symptom)).toEqual(['A', 'B', 'C', 'D']);
});

test('missing or invalid scores cannot create a directional highlight', () => {
  expect(symptomHighlights([item('A', NaN), item('B', Infinity)])).toEqual({ improved: null, worsened: null });
});
