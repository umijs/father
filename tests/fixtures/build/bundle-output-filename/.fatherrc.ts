import { defineConfig } from '../../../../src';

export default defineConfig({
  umd: {
    output: {
      path: 'nothing',
      filename: 'nothing.js',
    },
    entry: {
      'src/index': {
        output: {
          path: 'dist/abc',
          filename: 'index.umd.min.js',
        },
      },
    },
  },
});
