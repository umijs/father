export default {
  targets: 'es6',
  cjs: {
    transformer: 'esbuild',
    targets: ['es2017', 'chrome85'],
  },
  esm: {
    transformer: 'esbuild',
    // targets: 'es6',
  },
};
