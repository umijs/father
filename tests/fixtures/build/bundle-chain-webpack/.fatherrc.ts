import path from 'path';

export default {
  umd: {
    chainWebpack(config) {
      config.resolve.alias.set(
        'alias-module',
        path.join(__dirname, 'src/alias'),
      );

      return config;
    },
  },
};
