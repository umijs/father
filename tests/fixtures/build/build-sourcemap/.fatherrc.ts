import { defineConfig } from '../../../../src';

export default defineConfig({
  esm: {
    transformer: 'esbuild',
  },
  cjs: {},
  umd: {},
  sourcemap: true,
});
