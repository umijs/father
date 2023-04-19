import { defineConfig } from 'father';
import path from 'path';

export default defineConfig({
  esm: {},
  cjs: {},
  // umd: {
  //   externals: {
  //     vue: 'vue',
  //   },
  // },
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  platform: 'browser',
  plugins: ['@fatherjs/plugin-vue'],
});
