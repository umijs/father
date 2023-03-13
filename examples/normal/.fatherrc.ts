import { defineConfig } from '../../dist';
const path = require('path');

export default defineConfig({
  css: {
    preprocessorsOptions: {},
    theme: {
      'class-prefix-button': 'adm-btn',
    },
  },
  esm: {},
  cjs: {},
  umd: {},
  alias: {
    '@': path.resolve(__dirname, './src'),
    'hello-a': path.resolve(__dirname, './src/a.tsx'),
    'hello-foo': path.resolve(__dirname, './src/foo.ts'),
  },
  platform: 'browser',
});
