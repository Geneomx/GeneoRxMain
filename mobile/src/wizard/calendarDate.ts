/**
 * Calendar-date helpers for check-in entry.
 *
 * Dates are handled as local calendar days (YYYY-MM-DD), never UTC instants:
 * near midnight `new Date().toISOString()` lands on the wrong day depending on
 * the device's timezone offset.
 */

/** Today as a local YYYY-MM-DD string. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

/**
 * Convert a typed YYYY-MM-DD string into an ISO timestamp, or null if it is
 * not a real calendar date.
 *
 * Deliberately does NOT use `new Date("...T12:00:00")`: a shape-valid but
 * impossible date such as "2026-13-45" produces an Invalid Date whose
 * .toISOString() throws RangeError, which previously crashed the save. Building
 * from numeric components and round-tripping also rejects silent rollover —
 * "2026-02-30" would otherwise become March 2 with no indication to the user.
 *
 * Midday local time is used so the stored instant cannot shift to the adjacent
 * day when rendered in another timezone.
 */
export function isoFromCalendarDate(input: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isRealDate ? date.toISOString() : null;
}

/** Whether a typed value is a usable calendar date. */
export function isValidCalendarDate(input: string): boolean {
  return isoFromCalendarDate(input) !== null;
}
