import path from 'path';

export default {
  umd: {
    alias: {
      'alias-module': path.join(__dirname, 'src/alias'),
    },
  },
};
