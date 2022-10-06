import { defineConfig } from '../../../../src';

export default defineConfig({
  esm: { transformer: 'swc' },
  cjs: { transformer: 'swc' },
  umd: {},
  sourcemap: true,
});
