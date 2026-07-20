/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Next.js's own tsconfig.json sets jsx: "preserve" — correct for Next's own SWC/webpack
        // pipeline, but plain ts-jest (used for these unit/component tests, which run outside
        // Next's build entirely) needs JSX actually transformed into JS, hence the override here
        // rather than changing the project-wide tsconfig.
        tsconfig: { jsx: 'react-jsx' },
      },
    ],
  },
};
