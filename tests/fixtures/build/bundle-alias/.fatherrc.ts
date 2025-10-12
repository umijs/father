import { defineConfig } from '../../../../src';

export default defineConfig({
  umd: {
    alias: {
      'alias-module': './src/alias',
    },
  },
});
