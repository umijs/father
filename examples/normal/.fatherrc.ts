const path = require('path');

export default {
  esm: {},
  umd: {},
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  platform: 'browser',
};
