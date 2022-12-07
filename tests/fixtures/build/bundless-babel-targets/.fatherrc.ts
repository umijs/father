export default {
  cjs: {
    transformer: 'babel',
    targets: { chrome: 85 },
  },
  esm: {
    transformer: 'babel',
    targets: { ie: 11, chrome: 60 },
  },
};
