const path = require('path');

export default {
  esm: { type: 'rollup' },
  alias: {
    '@': path.join(__dirname, 'src'),
  }
}
