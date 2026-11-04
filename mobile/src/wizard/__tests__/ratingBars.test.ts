import { recordedRatings } from '../ratingBars';

test('zero is a real rating while invalid dates, missing numbers and out-of-range values stay out', () => {
  const points = recordedRatings([[100, 0], [200, 7], [NaN, 4], [300, NaN], [400, -1], [500, 11]]);
  expect(points.map(p => [p.time, p.value])).toEqual([[100, 0], [200, 7]]);
});
test('same-day entries remain separately selectable and dates are ordered without changing the saved input', () => {
  const input: Array<[number, number]> = [[200, 3], [100, 6], [200, 4]];
  const points = recordedRatings(input);
  expect(points.map(p => p.value)).toEqual([6, 3, 4]);
  expect(new Set(points.map(p => p.key)).size).toBe(3);
  expect(input).toEqual([[200, 3], [100, 6], [200, 4]]);
});
test('unrecorded ratings produce an empty chart rather than a zero or an invented trend', () => {
  expect(recordedRatings([])).toEqual([]);
  expect(recordedRatings([[NaN, NaN]])).toEqual([]);
});
