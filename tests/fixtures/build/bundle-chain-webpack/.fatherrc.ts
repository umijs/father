import path from 'path';
import { defineConfig } from '../../../../src';

export default defineConfig({
  umd: {
    chainWebpack(config) {
      config.resolve.alias.set(
        'alias-module',
        path.join(__dirname, 'src/alias'),
      );

      return config;
    },
  },
});
