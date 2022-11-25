export default {
  cjs: {
    transformer: 'babel',
    targets: 'chrome85',
  },
  esm: {
    transformer: 'babel',
    targets: ['ie11', 'chrome60'],
  },
};
