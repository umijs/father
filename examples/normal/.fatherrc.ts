const path = require('path');

export default {
  esm: {},
  cjs: {},
  umd: {},
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  platform: 'browser',
};
