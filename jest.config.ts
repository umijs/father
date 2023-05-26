import { createConfig } from '@umijs/test';

const defaultConfig = createConfig();

export default {
  ...defaultConfig,
  testTimeout: 600000,
  moduleNameMapper: {
    ...defaultConfig.moduleNameMapper,
    // @umijs/bundler-webpack requireHook not working for jest
    '^webpack$': '@umijs/bundler-webpack/compiled/webpack',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/cli/*.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/tests/fixtures/.+/compiled',
    '<rootDir>/tests/fixtures/.+/output',
    '<rootDir>/compiled',
  ],
};
