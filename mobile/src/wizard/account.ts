/** Age is optional; when supplied it must be a whole number from 1 to 120. */
export function isValidOptionalAge(value: string): boolean {
  return value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 120);
}

/** Call after validation so the backend receives an ordinary integer string. */
export function normalizeOptionalAge(value: string): string {
  return value === '' ? '' : String(Number(value));
}
