export default {
  cjs: {
    transformer: 'swc',
    targets: 'es2017',
  },
  esm: {
    transformer: 'swc',
    targets: 'es5',
  },
};
