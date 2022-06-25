import path from 'path';
import { defineConfig } from '../../../../src';

export default defineConfig({
  umd: {
    alias: {
      'alias-module': path.join(__dirname, 'src/alias'),
    },
  },
});
