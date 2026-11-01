import { isValidOptionalAge, normalizeOptionalAge } from '../account';
import { nextVisibleStep, normalizeStep } from '@/content/wizardData';

test.each(['', '1', '18', '120'])('accepts an optional or valid age: %s', age => {
  expect(isValidOptionalAge(age)).toBe(true);
});

test.each(['0', '121', '999', '-1', '1.5', 'abc'])('rejects an invalid age: %s', age => {
  expect(isValidOptionalAge(age)).toBe(false);
});

test('normalizes a validated age before sending it to the backend', () => {
  expect(normalizeOptionalAge('001')).toBe('1');
  expect(normalizeOptionalAge('')).toBe('');
});

test('the account form is available to guests and continues to medications', () => {
  expect(normalizeStep(0, true)).toBe(0);
  expect(nextVisibleStep(0, true)).toBe(1);
  expect(normalizeStep(0, false)).toBe(1);
});
