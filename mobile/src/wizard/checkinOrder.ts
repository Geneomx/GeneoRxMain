type DatedCheckin = { dateISO: string; id?: number | string };

/** A date-only form gives same-day entries identical timestamps. The server's
 * ascending record ID breaks that tie; pending local entries follow synced ones.
 * Actual dates/times always take priority, including backdated check-ins. */
export function compareCheckins(a: DatedCheckin, b: DatedCheckin): number {
  const time = (value: string) => {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : -Infinity;
  };
  const aTime = time(a.dateISO), bTime = time(b.dateISO);
  if (aTime !== bTime) return aTime < bTime ? -1 : 1;
  const sequence = (value: DatedCheckin['id']) => {
    const id = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
    return Number.isSafeInteger(id) && id >= 0 ? id : Infinity;
  };
  const aId = sequence(a.id), bId = sequence(b.id);
  return aId === bId ? 0 : aId < bId ? -1 : 1;
}
