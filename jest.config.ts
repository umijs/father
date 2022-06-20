import { createConfig } from '@umijs/test';

export default {
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/cli/*.ts'],
  ...createConfig(),
};
