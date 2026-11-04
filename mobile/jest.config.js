/**
 * Unit tests for the pure scoring engine.
 *
 * Scope covers the pure wizard engine and the notification startup guard,
 * whose native dependencies are mocked. They run under plain ts-jest in a
 * node environment — no jest-expo, no native mocks, no transform of the whole
 * RN dependency tree.
 *
 * This exists because the engine is duplicated by hand across mobile and the
 * web portal, and until now nothing but code review enforced that. See the
 * parity test in tests/Feature for the cross-platform half.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/wizard', '<rootDir>/src/notifications', '<rootDir>/src/api'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react', esModuleInterop: true } }],
  },
};
