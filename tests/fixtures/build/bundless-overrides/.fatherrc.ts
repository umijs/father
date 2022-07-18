export default {
  cjs: {
    overrides: {
      'src/client': {
        platform: 'browser',
      },
      'src/client/node': {
        platform: 'node',
      },
    },
  },
};
