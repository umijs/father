import { defineConfig } from '../../../../src';

export default defineConfig({
  umd: {
    output: {
      path: 'dist/abc',
      filename: 'index.umd.min.js',
    },
  },
});
