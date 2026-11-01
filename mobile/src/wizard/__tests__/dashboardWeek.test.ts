import { dashboardWeek } from '../dashboardWeek';

const now = new Date(2026, 9, 29, 16);
const entry = (day: number, hour = 12) => ({ dateISO: new Date(2026, 9, day, hour).toISOString() });

test('the strip ends today and has seven consecutive local dates', () => {
  const days = dashboardWeek([], now);
  expect(days.map(day => day.key)).toEqual(['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29']);
  expect(days.filter(day => day.today)).toHaveLength(1);
  expect(days.every(day => day.count === 0 && day.latestIndex === null)).toBe(true);
});
test('same-day entries link to the latest actual record, retaining the original array index', () => {
  const days = dashboardWeek([entry(28, 18), entry(28, 9), entry(29)], now);
  expect(days[5]).toMatchObject({ count: 2, latestIndex: 0 });
  expect(days[6]).toMatchObject({ count: 1, latestIndex: 2 });
});
test('invalid, future-day and older records do not create completion dots', () => {
  expect(dashboardWeek([{ dateISO: 'invalid' }, entry(30), entry(22)], now).every(day => day.count === 0)).toBe(true);
});
test('the strip uses the local day near midnight without mutating history', () => {
  const history = [entry(29, 0), entry(28, 23)];
  const before = JSON.stringify(history);
  const days = dashboardWeek(history, new Date(2026, 9, 29, 0, 10));
  expect(days[6].latestIndex).toBe(0);
  expect(days[5].latestIndex).toBe(1);
  expect(JSON.stringify(history)).toBe(before);
});
