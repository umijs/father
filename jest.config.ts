import { createConfig } from '@umijs/test';

export default {
  ...createConfig(),
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/cli/*.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/tests/fixtures/.+/compiled',
    '<rootDir>/tests/fixtures/.+/output',
    '<rootDir>/compiled',
  ],
};
