export default {
  cjs: {
    transformer: 'swc',
    targets: { chrome: 85 },
  },
  esm: {
    transformer: 'swc',
    targets: { ie: 11 },
  },
};
