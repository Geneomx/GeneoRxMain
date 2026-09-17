/**
 * Unit tests for the pure scoring engine.
 *
 * Scope is deliberately narrow: `src/wizard/` only. Those modules are pure
 * TypeScript with no React Native imports, so they run under plain ts-jest in a
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
  roots: ['<rootDir>/src/wizard'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react', esModuleInterop: true } }],
  },
};
