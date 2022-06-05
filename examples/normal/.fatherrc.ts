const path = require('path');

export default {
  esm: {
    output: 'dist/esm',
  },
  umd: {
    output: 'dist/umd',
  },
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
  platform: 'browser',
};
