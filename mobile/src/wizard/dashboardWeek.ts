import { localCalendarDate } from './calendarDate';
import { compareCheckins } from './checkinOrder';

/** Seven local dates ending today. Dots represent saved entries, never inferred doses. */
export function dashboardWeek(records: Array<{ dateISO: string; id?: number | string }>, now = new Date()) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + offset, 12);
    const key = localCalendarDate(date);
    const matches = records.flatMap((record, index) => {
      const time = new Date(record.dateISO);
      return Number.isFinite(time.getTime()) && localCalendarDate(time) === key ? [{ index, time: time.getTime() }] : [];
    });
    const latest = matches.reduce<{ index: number; time: number } | null>((last, row) => !last || compareCheckins(records[row.index], records[last.index]) >= 0 ? row : last, null);
    return { date, key, today: offset === 6, count: matches.length, latestIndex: latest?.index ?? null };
  });
}
